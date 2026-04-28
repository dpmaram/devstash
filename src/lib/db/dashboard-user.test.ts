import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("getDashboardUserForSession", () => {
  it("uses the fallback dashboard user when one is available", async () => {
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
      id: "demo_user",
    });
  });

  it("uses the signed-in session user when no fallback dashboard user exists", async () => {
    const { getDashboardUserForSession } = await import("./dashboard-user");

    const user = await getDashboardUserForSession(
      {
        id: "user_123",
      },
      {
        getFallbackDashboardUser: async () => null,
      },
    );

    assert.deepEqual(user, {
      id: "user_123",
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
