import assert from "node:assert/strict";
import { describe, it } from "vitest";

import type { RateLimitBlockedResult } from "./lib/rate-limit";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

const blockedRateLimit: RateLimitBlockedResult = {
  success: false,
  limit: 3,
  remaining: 0,
  reset: 1_774_651_260_000,
  retryAfter: 60,
  error: "Too many attempts. Please try again in 1 minute.",
};

describe("registration route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/auth/register/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns a 400 response for invalid JSON", async () => {
    const { POST } = await import("./app/api/auth/register/route");

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "not-json",
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Request body must be valid JSON.",
    });
  });

  it("returns a 400 response for mismatched passwords", async () => {
    const { POST } = await import("./app/api/auth/register/route");

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Ada",
          email: "ada@example.com",
          password: "password123",
          confirmPassword: "different-password",
        }),
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Passwords do not match.",
    });
  });

  it("returns a 429 response when registration attempts are rate limited", async () => {
    const route = (await import("./app/api/auth/register/route-handler")) as unknown as {
      handleRegisterPost: (
        request: Request,
        deps: {
          checkRateLimit: () => Promise<RateLimitBlockedResult>;
          createRegisterUserDeps: () => never;
          registerUser: () => Promise<never>;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleRegisterPost(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Ada",
          email: "ada@example.com",
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
      {
        checkRateLimit: async () => blockedRateLimit,
        createRegisterUserDeps: () => {
          throw new Error("createRegisterUserDeps should not be called");
        },
        registerUser: async () => {
          throw new Error("registerUser should not be called");
        },
      },
    );

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "60");
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Too many attempts. Please try again in 1 minute.",
    });
  });

  it("creates verification email deps without trusting the request origin", async () => {
    const route = (await import("./app/api/auth/register/route-handler")) as unknown as {
      handleRegisterPost: (
        request: Request,
        deps: {
          checkRateLimit: () => Promise<{ success: true }>;
          createRegisterUserDeps: (options?: {
            baseUrl?: string;
          }) => { trusted: true };
          registerUser: (
            body: unknown,
            deps: { trusted: true },
          ) => Promise<{
            ok: true;
            status: number;
            user: { id: string };
            emailVerificationRequired: boolean;
          }>;
        },
      ) => Promise<Response>;
    };
    const receivedOptions: Array<{ baseUrl?: string } | undefined> = [];

    const response = await route.handleRegisterPost(
      new Request("https://evil.example/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Ada",
          email: "ada@example.com",
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
      {
        checkRateLimit: async () => ({ success: true }),
        createRegisterUserDeps: (options) => {
          receivedOptions.push(options);
          return { trusted: true };
        },
        registerUser: async () => ({
          ok: true,
          status: 201,
          user: { id: "user_123" },
          emailVerificationRequired: true,
        }),
      },
    );

    assert.equal(response.status, 201);
    assert.deepEqual(receivedOptions, [undefined]);
  });
});
