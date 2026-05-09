import assert from "node:assert/strict";
import { describe, it } from "vitest";

import type { DashboardCollection } from "@/lib/db/collections";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

const dashboardCollection: DashboardCollection = {
  id: "collection_123",
  name: "Launch Recipes",
  slug: "launch-recipes",
  description: "Deploy flows and release commands.",
  itemCount: 0,
  isFavorite: false,
  accentColor: "#fde047",
  updatedAt: "Just now",
  types: [
    {
      id: "type_note",
      name: "note",
      slug: "note",
      icon: "StickyNote",
      color: "#fde047",
    },
  ],
};

const proBillingDeps = {
  getUserBillingState: async () => ({
    id: "user_123",
    planTier: "PRO" as const,
    isPro: true,
    stripeCustomerId: "cus_123",
    stripeSubscriptionId: "sub_123",
  }),
  getUserCollectionCount: async () => 0,
};

describe("createCollection action", () => {
  it("rejects invalid payloads before auth or database writes", async () => {
    const { handleCreateCollection } = await import("./collections");

    const result = await handleCreateCollection(
      {
        name: "   ",
        description: "Release workflows",
      },
      {
        auth: async () => {
          throw new Error("auth should not be called");
        },
        createCollection: async () => {
          throw new Error("createCollection should not be called");
        },
        getDashboardUserForSession: async () => {
          throw new Error("getDashboardUserForSession should not be called");
        },
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "Name is required.",
    });
  });

  it("requires a signed-in user", async () => {
    const { handleCreateCollection } = await import("./collections");

    const result = await handleCreateCollection(
      {
        name: "Launch Recipes",
      },
      {
        auth: async () => null,
        createCollection: async () => {
          throw new Error("createCollection should not be called");
        },
        getDashboardUserForSession: async () => {
          throw new Error("getDashboardUserForSession should not be called");
        },
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "You must be signed in.",
    });
  });

  it("creates the resolved dashboard user's collection with normalized data", async () => {
    const { handleCreateCollection } = await import("./collections");

    const result = await handleCreateCollection(
      {
        name: "  Launch Recipes  ",
        description: "  Deploy flows and release commands.  ",
      },
      {
        ...proBillingDeps,
        auth: async () => ({
          user: {
            id: "signed_in_user",
          },
        }),
        createCollection: async (input) => {
          assert.deepEqual(input, {
            userId: "user_123",
            data: {
              name: "Launch Recipes",
              description: "Deploy flows and release commands.",
            },
          });
          return dashboardCollection;
        },
        getDashboardUserForSession: async (sessionUser) => {
          assert.deepEqual(sessionUser, {
            id: "signed_in_user",
          });
          return {
            id: "user_123",
          };
        },
      },
    );

    assert.deepEqual(result, {
      success: true,
      data: dashboardCollection,
    });
  });

  it("returns a create error when the collection cannot be created", async () => {
    const { handleCreateCollection } = await import("./collections");

    const result = await handleCreateCollection(
      {
        name: "Launch Recipes",
      },
      {
        ...proBillingDeps,
        auth: async () => ({
          user: {
            id: "user_123",
          },
        }),
        createCollection: async () => null,
        getDashboardUserForSession: async () => ({
          id: "user_123",
        }),
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "Unable to create collection.",
    });
  });

  it("blocks collection creation when the free plan collection limit is reached", async () => {
    const { handleCreateCollection } = await import("./collections");

    const result = await handleCreateCollection(
      {
        name: "Overflow Collection",
      },
      {
        auth: async () => ({
          user: {
            id: "user_123",
          },
        }),
        getUserBillingState: async () => ({
          id: "user_123",
          planTier: "FREE",
          isPro: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        }),
        getUserCollectionCount: async () => 3,
        createCollection: async () => {
          throw new Error("createCollection should not be called");
        },
        getDashboardUserForSession: async () => ({
          id: "user_123",
        }),
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "Free plan limit reached: 3 collections. Upgrade to Pro for unlimited collections.",
    });
  });
});
