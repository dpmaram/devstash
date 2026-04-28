import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("getDashboardUserForSession", () => {
  it("uses the signed-in session user when they have items", async () => {
    const { getDashboardUserForSession } = await import("./dashboard-user");
    let fallbackCalled = false;

    const user = await getDashboardUserForSession(
      {
        id: "user_123",
      },
      {
        getFallbackDashboardUser: async () => {
          fallbackCalled = true;
          return {
            id: "demo_user",
          };
        },
        hasDashboardItems: async (userId) => {
          assert.equal(userId, "user_123");
          return true;
        },
      },
    );

    assert.deepEqual(user, {
      id: "user_123",
    });
    assert.equal(fallbackCalled, false);
  });

  it("falls back to the demo dashboard user when the session user has no items", async () => {
    const { getDashboardUserForSession } = await import("./dashboard-user");

    const user = await getDashboardUserForSession(
      {
        id: "user_123",
      },
      {
        getFallbackDashboardUser: async () => ({
          id: "demo_user",
        }),
        hasDashboardItems: async (userId) => {
          assert.equal(userId, "user_123");
          return false;
        },
      },
    );

    assert.deepEqual(user, {
      id: "demo_user",
    });
  });

  it("falls back to the demo dashboard user when there is no session user", async () => {
    const { getDashboardUserForSession } = await import("./dashboard-user");

    const user = await getDashboardUserForSession(null, {
      getFallbackDashboardUser: async () => ({
        id: "demo_user",
      }),
      hasDashboardItems: async () => {
        throw new Error("hasDashboardItems should not be called");
      },
    });

    assert.deepEqual(user, {
      id: "demo_user",
    });
  });
});
