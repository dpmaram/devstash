import assert from "node:assert/strict";
import { describe, it } from "node:test";

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

describe("forgot password route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/auth/forgot-password/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns a 400 response for invalid JSON", async () => {
    const { POST } = await import("./app/api/auth/forgot-password/route");

    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
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

  it("returns a 400 response for malformed email input", async () => {
    const { POST } = await import("./app/api/auth/forgot-password/route");

    const response = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "bad-email",
        }),
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Enter a valid email address.",
    });
  });

  it("returns a 429 response when forgot-password requests are rate limited", async () => {
    const route = (await import("./app/api/auth/forgot-password/route")) as typeof import("./app/api/auth/forgot-password/route") & {
      handleForgotPasswordPost: (
        request: Request,
        deps: {
          checkRateLimit: () => Promise<RateLimitBlockedResult>;
          createRequestPasswordResetDeps: () => never;
          requestPasswordReset: () => Promise<never>;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleForgotPasswordPost(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "ada@example.com",
        }),
      }),
      {
        checkRateLimit: async () => blockedRateLimit,
        createRequestPasswordResetDeps: () => {
          throw new Error("createRequestPasswordResetDeps should not be called");
        },
        requestPasswordReset: async () => {
          throw new Error("requestPasswordReset should not be called");
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
});

describe("reset password route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/auth/reset-password/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns a 400 response for invalid JSON", async () => {
    const { POST } = await import("./app/api/auth/reset-password/route");

    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
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
    const { POST } = await import("./app/api/auth/reset-password/route");

    const response = await POST(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "ada@example.com",
          token: "raw-reset-token",
          password: "new-password",
          confirmPassword: "different-password",
        }),
      }),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      resetStatus: "invalid",
      error: "Passwords do not match.",
    });
  });

  it("returns a 429 response when reset-password requests are rate limited", async () => {
    const route = (await import("./app/api/auth/reset-password/route")) as typeof import("./app/api/auth/reset-password/route") & {
      handleResetPasswordPost: (
        request: Request,
        deps: {
          checkRateLimit: () => Promise<RateLimitBlockedResult>;
          resetPassword: () => Promise<never>;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleResetPasswordPost(
      new Request("http://localhost/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "ada@example.com",
          token: "raw-reset-token",
          password: "new-password",
          confirmPassword: "new-password",
        }),
      }),
      {
        checkRateLimit: async () => blockedRateLimit,
        resetPassword: async () => {
          throw new Error("resetPassword should not be called");
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
});
