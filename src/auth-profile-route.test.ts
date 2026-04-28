import assert from "node:assert/strict";
import { describe, it } from "vitest";

import type { RateLimitBlockedResult } from "./lib/rate-limit";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

const blockedRateLimit: RateLimitBlockedResult = {
  success: false,
  limit: 5,
  remaining: 0,
  reset: 1_774_651_260_000,
  retryAfter: 60,
  error: "Too many attempts. Please try again in 1 minute.",
};

describe("profile change password route", () => {
  it("exports a POST handler", async () => {
    const route = await import("./app/api/profile/change-password/route");

    assert.equal(typeof route.POST, "function");
  });

  it("returns a 400 response for invalid JSON", async () => {
    const { POST } = await import("./app/api/profile/change-password/route");

    const response = await POST(
      new Request("http://localhost/api/profile/change-password", {
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

  it("returns a 429 response when password changes are rate limited", async () => {
    const route = (await import("./app/api/profile/change-password/route")) as typeof import("./app/api/profile/change-password/route") & {
      handleChangePasswordPost: (
        request: Request,
        deps: {
          auth: () => Promise<{ user: { id: string } }>;
          checkRateLimit: () => Promise<RateLimitBlockedResult>;
          changePassword: () => Promise<never>;
          createChangePasswordDeps: () => never;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleChangePasswordPost(
      new Request("http://localhost/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: "old-password",
          newPassword: "new-password",
          confirmPassword: "new-password",
        }),
      }),
      {
        auth: async () => ({
          user: {
            id: "user_123",
          },
        }),
        checkRateLimit: async () => blockedRateLimit,
        changePassword: async () => {
          throw new Error("changePassword should not be called");
        },
        createChangePasswordDeps: () => {
          throw new Error("createChangePasswordDeps should not be called");
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

describe("profile delete account route", () => {
  it("exports a DELETE handler", async () => {
    const route = await import("./app/api/profile/delete-account/route");

    assert.equal(typeof route.DELETE, "function");
  });

  it("returns a 400 response for invalid JSON", async () => {
    const { DELETE } = await import("./app/api/profile/delete-account/route");

    const response = await DELETE(
      new Request("http://localhost/api/profile/delete-account", {
        method: "DELETE",
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
});
