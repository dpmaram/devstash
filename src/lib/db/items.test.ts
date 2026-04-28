import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

describe("normalizeItemTypeRouteSlug", () => {
  it("normalizes plural item type route slugs", async () => {
    const { normalizeItemTypeRouteSlug } = await import("./items");

    assert.equal(normalizeItemTypeRouteSlug("snippets"), "snippet");
    assert.equal(normalizeItemTypeRouteSlug("prompts"), "prompt");
    assert.equal(normalizeItemTypeRouteSlug("commands"), "command");
    assert.equal(normalizeItemTypeRouteSlug("notes"), "note");
    assert.equal(normalizeItemTypeRouteSlug("files"), "file");
    assert.equal(normalizeItemTypeRouteSlug("images"), "image");
    assert.equal(normalizeItemTypeRouteSlug("links"), "link");
  });
});

describe("normalizeItemTags", () => {
  it("trims, slugs, and deduplicates item tags", async () => {
    const { normalizeItemTags } = await import("./items");

    assert.deepEqual(
      normalizeItemTags([" React ", "react", "Auth Hooks", "auth hooks", ""]),
      [
        {
          name: "React",
          slug: "react",
        },
        {
          name: "Auth Hooks",
          slug: "auth-hooks",
        },
      ],
    );
  });
});

describe("updateItem", () => {
  it("does not update items outside the signed-in user", async () => {
    const { updateItem } = await import("./items");
    const result = await updateItem(
      {
        itemId: "item_123",
        userId: "user_123",
        data: {
          title: "useAuth Hook",
          description: null,
          content: null,
          url: null,
          language: null,
          tags: ["react"],
        },
      },
      {
        findOwnedItem: async () => null,
        updateItemFields: async () => {
          throw new Error("updateItemFields should not be called");
        },
        deleteItemTags: async () => {
          throw new Error("deleteItemTags should not be called");
        },
        upsertTag: async () => {
          throw new Error("upsertTag should not be called");
        },
        createItemTags: async () => {
          throw new Error("createItemTags should not be called");
        },
        findItemDetail: async () => {
          throw new Error("findItemDetail should not be called");
        },
      },
    );

    assert.equal(result, null);
  });

  it("updates fields, replaces tags, and returns updated detail", async () => {
    const { updateItem } = await import("./items");
    const calls: string[] = [];

    const result = await updateItem(
      {
        itemId: "item_123",
        userId: "user_123",
        data: {
          title: "useAuth Hook",
          description: "Custom authentication hook.",
          content: "export function useAuth() {}",
          url: null,
          language: "TypeScript",
          tags: ["react", "auth"],
        },
      },
      {
        findOwnedItem: async (input) => {
          calls.push(`findOwnedItem:${input.itemId}:${input.userId}`);
          return {
            id: input.itemId,
          };
        },
        updateItemFields: async (input) => {
          calls.push(`updateItemFields:${input.itemId}:${input.data.title}`);
        },
        deleteItemTags: async (itemId) => {
          calls.push(`deleteItemTags:${itemId}`);
        },
        upsertTag: async (input) => {
          calls.push(`upsertTag:${input.name}:${input.slug}`);
          return {
            id: `tag_${input.slug}`,
          };
        },
        createItemTags: async (input) => {
          calls.push(
            `createItemTags:${input.itemId}:${input.tagIds.join(",")}`,
          );
        },
        findItemDetail: async (input) => {
          calls.push(`findItemDetail:${input.itemId}:${input.userId}`);
          return {
            id: input.itemId,
            title: "useAuth Hook",
            description: "Custom authentication hook.",
            contentType: "TEXT",
            content: "export function useAuth() {}",
            url: null,
            fileUrl: null,
            fileName: null,
            fileSize: null,
            language: "TypeScript",
            isPinned: false,
            isFavorite: true,
            createdAt: new Date("2026-01-15T12:30:00.000Z"),
            updatedAt: new Date("2026-04-25T15:45:00.000Z"),
            itemType: {
              id: "type_snippet",
              name: "snippet",
              slug: "snippet",
              icon: "Code",
              color: "#3b82f6",
            },
            collections: [],
            tags: [
              { tag: { name: "react", slug: "react" } },
              { tag: { name: "auth", slug: "auth" } },
            ],
          };
        },
      },
    );

    assert.deepEqual(calls, [
      "findOwnedItem:item_123:user_123",
      "updateItemFields:item_123:useAuth Hook",
      "deleteItemTags:item_123",
      "upsertTag:react:react",
      "upsertTag:auth:auth",
      "createItemTags:item_123:tag_react,tag_auth",
      "findItemDetail:item_123:user_123",
    ]);
    assert.equal(result?.id, "item_123");
    assert.deepEqual(result?.tags, [
      { name: "react", slug: "react" },
      { name: "auth", slug: "auth" },
    ]);
  });
});
