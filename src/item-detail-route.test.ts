import assert from "node:assert/strict";
import { describe, it } from "vitest";

import type { ItemDetail } from "./lib/db/items";

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
  collections: [
    {
      id: "collection_react_patterns",
      name: "React Patterns",
      slug: "react-patterns",
    },
  ],
  tags: [
    {
      name: "react",
      slug: "react",
    },
  ],
  createdAt: "2026-01-15T12:30:00.000Z",
  updatedAt: "2026-04-25T15:45:00.000Z",
  createdAtLabel: "January 15, 2026",
  updatedAtLabel: "April 25, 2026",
  isPinned: true,
  isFavorite: true,
  accentColor: "#3b82f6",
};

describe("item detail route", () => {
  it("exports a GET handler", async () => {
    const route = await import("./app/api/items/[id]/route");

    assert.equal(typeof route.GET, "function");
  });

  it("returns 401 when the user is not signed in", async () => {
    const route = (await import("./app/api/items/[id]/route")) as typeof import("./app/api/items/[id]/route") & {
      handleGetItemDetail: (
        request: Request,
        context: { params: Promise<{ id: string }> },
        deps: {
          auth: () => Promise<null>;
          getItemDetail: () => Promise<never>;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleGetItemDetail(
      new Request("http://localhost/api/items/item_123"),
      {
        params: Promise.resolve({ id: "item_123" }),
      },
      {
        auth: async () => null,
        getItemDetail: async () => {
          throw new Error("getItemDetail should not be called");
        },
      },
    );

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "You must be signed in.",
    });
  });

  it("returns 404 when the item does not belong to the signed-in user", async () => {
    const route = (await import("./app/api/items/[id]/route")) as typeof import("./app/api/items/[id]/route") & {
      handleGetItemDetail: (
        request: Request,
        context: { params: Promise<{ id: string }> },
        deps: {
          auth: () => Promise<{ user: { id: string } }>;
          getItemDetail: (input: {
            itemId: string;
            userId: string;
          }) => Promise<ItemDetail | null>;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleGetItemDetail(
      new Request("http://localhost/api/items/item_123"),
      {
        params: Promise.resolve({ id: "item_123" }),
      },
      {
        auth: async () => ({
          user: {
            id: "user_123",
          },
        }),
        getItemDetail: async (input) => {
          assert.deepEqual(input, {
            itemId: "item_123",
            userId: "user_123",
          });
          return null;
        },
      },
    );

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "Item not found.",
    });
  });

  it("returns the signed-in user's item detail", async () => {
    const route = (await import("./app/api/items/[id]/route")) as typeof import("./app/api/items/[id]/route") & {
      handleGetItemDetail: (
        request: Request,
        context: { params: Promise<{ id: string }> },
        deps: {
          auth: () => Promise<{ user: { id: string } }>;
          getItemDetail: (input: {
            itemId: string;
            userId: string;
          }) => Promise<ItemDetail | null>;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleGetItemDetail(
      new Request("http://localhost/api/items/item_123"),
      {
        params: Promise.resolve({ id: "item_123" }),
      },
      {
        auth: async () => ({
          user: {
            id: "user_123",
          },
        }),
        getItemDetail: async (input) => {
          assert.deepEqual(input, {
            itemId: "item_123",
            userId: "user_123",
          });
          return itemDetail;
        },
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true,
      item: itemDetail,
    });
  });
});
