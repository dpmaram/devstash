import assert from "node:assert/strict";
import { describe, it } from "vitest";

import type { ItemDetail } from "@/lib/db/items";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

const itemDetail: ItemDetail = {
  id: "item_123",
  title: "useAuth Hook",
  description: "Custom authentication hook for React applications.",
  contentType: "TEXT",
  content: "export function useAuth() {}",
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  language: "typescript",
  typeSlug: "snippet",
  itemType: {
    id: "type_snippet",
    name: "snippet",
    slug: "snippet",
    icon: "Code",
    color: "#3b82f6",
  },
  collections: [],
  tags: [],
  createdAt: "2026-01-15T12:30:00.000Z",
  updatedAt: "2026-04-25T15:45:00.000Z",
  createdAtLabel: "January 15, 2026",
  updatedAtLabel: "April 25, 2026",
  isPinned: true,
  isFavorite: true,
  accentColor: "#3b82f6",
};

describe("updateItem action", () => {
  it("rejects invalid payloads before auth or database writes", async () => {
    const { handleUpdateItem } = await import("./items");

    const result = await handleUpdateItem(
      "item_123",
      {
        title: "   ",
        tags: ["react"],
      },
      {
        auth: async () => {
          throw new Error("auth should not be called");
        },
        getDashboardUserForSession: async () => {
          throw new Error("getDashboardUserForSession should not be called");
        },
        updateItem: async () => {
          throw new Error("updateItem should not be called");
        },
      },
    );

    assert.equal(result.success, false);
    assert.match(result.error, /Title is required/);
  });

  it("requires a signed-in user", async () => {
    const { handleUpdateItem } = await import("./items");

    const result = await handleUpdateItem(
      "item_123",
      {
        title: "useAuth Hook",
        tags: ["react"],
      },
      {
        auth: async () => null,
        getDashboardUserForSession: async () => {
          throw new Error("getDashboardUserForSession should not be called");
        },
        updateItem: async () => {
          throw new Error("updateItem should not be called");
        },
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "You must be signed in.",
    });
  });

  it("updates the signed-in user's item with normalized data", async () => {
    const { handleUpdateItem } = await import("./items");

    const result = await handleUpdateItem(
      " item_123 ",
      {
        title: "  useAuth Hook  ",
        description: "  Custom hook  ",
        content: "  export function useAuth() {}  ",
        url: "",
        language: "  TypeScript  ",
        tags: ["react", "hooks"],
      },
      {
        auth: async () => ({
          user: {
            id: "user_123",
          },
        }),
        getDashboardUserForSession: async (sessionUser) => {
          assert.deepEqual(sessionUser, {
            id: "user_123",
          });
          return {
            id: "user_123",
          };
        },
        updateItem: async (input) => {
          assert.deepEqual(input, {
            itemId: "item_123",
            userId: "user_123",
            data: {
              title: "useAuth Hook",
              description: "Custom hook",
              content: "export function useAuth() {}",
              url: null,
              language: "TypeScript",
              tags: ["react", "hooks"],
            },
          });
          return itemDetail;
        },
      },
    );

    assert.deepEqual(result, {
      success: true,
      data: itemDetail,
    });
  });

  it("updates the resolved dashboard user's item when demo fallback data is shown", async () => {
    const { handleUpdateItem } = await import("./items");

    const result = await handleUpdateItem(
      "item_123",
      {
        title: "useAuth Hook",
        tags: ["react"],
      },
      {
        auth: async () => ({
          user: {
            id: "empty_user",
          },
        }),
        getDashboardUserForSession: async (sessionUser) => {
          assert.deepEqual(sessionUser, {
            id: "empty_user",
          });
          return {
            id: "demo_user",
          };
        },
        updateItem: async (input) => {
          assert.equal(input.userId, "demo_user");
          return itemDetail;
        },
      },
    );

    assert.deepEqual(result, {
      success: true,
      data: itemDetail,
    });
  });

  it("returns a not-found error for items outside the signed-in user", async () => {
    const { handleUpdateItem } = await import("./items");

    const result = await handleUpdateItem(
      "item_123",
      {
        title: "useAuth Hook",
        tags: ["react"],
      },
      {
        auth: async () => ({
          user: {
            id: "user_123",
          },
        }),
        getDashboardUserForSession: async () => ({
          id: "user_123",
        }),
        updateItem: async () => null,
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "Item not found.",
    });
  });
});
