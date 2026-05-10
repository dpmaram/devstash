import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  checkRateLimit,
  checkUserRateLimit,
  createRateLimitKey,
  createUserRateLimitKey,
  createTooManyRequestsResponse,
  type RateLimitDeps,
} from "./rate-limit";

const fixedNow = 1_774_651_200_000;

function createRequest(headers: HeadersInit = {}) {
  return new Request("https://devstash.test/api/auth/register", {
    headers,
  });
}

describe("createRateLimitKey", () => {
  it("keys credentials attempts by forwarded IP and normalized email", () => {
    const request = createRequest({
      "x-forwarded-for": "203.0.113.10, 198.51.100.9",
    });

    assert.equal(
      createRateLimitKey("credentialsLogin", request, {
        identifier: " ADA@Example.COM ",
      }),
      "auth:credentials-login:203.0.113.10:ada@example.com",
    );
  });

  it("keys IP-only rules without an identifier", () => {
    const request = createRequest({
      "x-real-ip": "198.51.100.24",
    });

    assert.equal(
      createRateLimitKey("register", request),
      "auth:register:198.51.100.24",
    );
  });
});

describe("createUserRateLimitKey", () => {
  it("creates a normalized user-scoped key", () => {
    assert.equal(
      createUserRateLimitKey("aiAutoTags", " User_123 "),
      "ai:auto-tags:user_123",
    );
  });
});

describe("checkRateLimit", () => {
  it("returns retry metadata and a friendly error when a limit is exceeded", async () => {
    const deps: RateLimitDeps = {
      limit: async () => ({
        success: false,
        limit: 3,
        remaining: 0,
        reset: fixedNow + 121_000,
      }),
      now: () => fixedNow,
    };

    const result = await checkRateLimit(
      "register",
      createRequest({
        "x-forwarded-for": "203.0.113.10",
      }),
      {},
      deps,
    );

    assert.deepEqual(result, {
      success: false,
      limit: 3,
      remaining: 0,
      reset: fixedNow + 121_000,
      retryAfter: 121,
      error: "Too many attempts. Please try again in 3 minutes.",
    });
  });

  it("fails open when the limiter backend is unavailable", async () => {
    const deps: RateLimitDeps = {
      limit: async () => {
        throw new Error("redis unavailable");
      },
      now: () => fixedNow,
    };

    const result = await checkRateLimit("forgotPassword", createRequest(), {}, deps);

    assert.equal(result.success, true);
    assert.equal(result.remaining, Number.POSITIVE_INFINITY);
  });
});

describe("checkUserRateLimit", () => {
  it("returns blocked metadata for user-scoped limits", async () => {
    const deps: RateLimitDeps = {
      limit: async () => ({
        success: false,
        limit: 20,
        remaining: 0,
        reset: fixedNow + 60_000,
      }),
      now: () => fixedNow,
    };

    const result = await checkUserRateLimit("aiAutoTags", "user_123", deps);

    assert.deepEqual(result, {
      success: false,
      limit: 20,
      remaining: 0,
      reset: fixedNow + 60_000,
      retryAfter: 60,
      error: "Too many attempts. Please try again in 1 minute.",
    });
  });
});

describe("createTooManyRequestsResponse", () => {
  it("returns a 429 JSON response with Retry-After", async () => {
    const response = createTooManyRequestsResponse({
      success: false,
      limit: 5,
      remaining: 0,
      reset: fixedNow + 60_000,
      retryAfter: 60,
      error: "Too many attempts. Please try again in 1 minute.",
    });

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "60");
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Too many attempts. Please try again in 1 minute.",
    });
  });
});
