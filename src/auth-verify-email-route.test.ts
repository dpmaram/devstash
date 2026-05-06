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

describe("email verification route", () => {
  it("exports a GET handler", async () => {
    const route = await import("./app/api/auth/verify-email/route");

    assert.equal(typeof route.GET, "function");
  });

  it("redirects invalid verification requests to sign in with a status", async () => {
    const { GET } = await import("./app/api/auth/verify-email/route");

    const response = await GET(
      new Request("http://localhost/api/auth/verify-email", {
        method: "GET",
      }),
    );

    assert.equal(response.status, 303);
    assert.equal(
      response.headers.get("location"),
      "http://localhost/sign-in?emailVerification=invalid",
    );
  });
});

describe("resend verification route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/auth/resend-verification/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns a 400 response for invalid JSON", async () => {
    const { POST } = await import("./app/api/auth/resend-verification/route");

    const response = await POST(
      new Request("http://localhost/api/auth/resend-verification", {
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

  it("returns a 429 response when resend requests are rate limited", async () => {
    const route = (await import("./app/api/auth/resend-verification/route-handler")) as unknown as {
      handleResendVerificationPost: (
        request: Request,
        deps: {
          checkRateLimit: () => Promise<RateLimitBlockedResult>;
          requestEmailVerification: () => Promise<never>;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleResendVerificationPost(
      new Request("http://localhost/api/auth/resend-verification", {
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
        requestEmailVerification: async () => {
          throw new Error("requestEmailVerification should not be called");
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
