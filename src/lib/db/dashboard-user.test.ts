import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("getDashboardUserForSession", () => {
  it("uses the signed-in session user even when fallback dashboard data exists", async () => {
    const { getDashboardUserForSession } = await import("./dashboard-user");

    const user = await getDashboardUserForSession(
      {
        id: "user_123",
      },
      {
        getFallbackDashboardUser: async () => {
          return {
            id: "demo_user",
          };
        },
      },
    );

    assert.deepEqual(user, {
      id: "user_123",
    });
  });

  it("uses the fallback dashboard user only when no signed-in session user exists", async () => {
    const { getDashboardUserForSession } = await import("./dashboard-user");

    const user = await getDashboardUserForSession(null, {
      getFallbackDashboardUser: async () => ({
        id: "demo_user",
      }),
    });

    assert.deepEqual(user, {
      id: "demo_user",
    });
  });

  it("uses the fallback dashboard user when the signed-in session user no longer exists", async () => {
    const { getDashboardUserForSession } = await import("./dashboard-user");
    const calls: string[] = [];

    const user = await getDashboardUserForSession(
      {
        id: "stale_user",
      },
      {
        findDashboardUserById: async (userId) => {
          calls.push(`findDashboardUserById:${userId}`);
          return null;
        },
        getFallbackDashboardUser: async () => {
          calls.push("getFallbackDashboardUser");
          return {
            id: "demo_user",
          };
        },
      },
    );

    assert.deepEqual(calls, [
      "findDashboardUserById:stale_user",
      "getFallbackDashboardUser",
    ]);
    assert.deepEqual(user, {
      id: "demo_user",
    });
  });

  it("returns null when there is no fallback user or session user", async () => {
    const { getDashboardUserForSession } = await import("./dashboard-user");

    const user = await getDashboardUserForSession(null, {
      getFallbackDashboardUser: async () => null,
    });

    assert.equal(user, null);
  });
});
