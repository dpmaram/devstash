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

describe("createItem", () => {
  it("does not create an item when the item type cannot be found", async () => {
    const { createItem } = await import("./items");
    const result = await createItem(
      {
        userId: "user_123",
        data: {
          typeSlug: "snippet",
          title: "useAuth Hook",
          description: null,
          content: "export function useAuth() {}",
          url: null,
          language: "TypeScript",
          tags: ["react"],
        },
      },
      {
        findItemTypeBySlug: async () => null,
        createItemRecord: async () => {
          throw new Error("createItemRecord should not be called");
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

  it("creates an item, connects tags, and returns detail", async () => {
    const { createItem } = await import("./items");
    const calls: string[] = [];

    const result = await createItem(
      {
        userId: "user_123",
        data: {
          typeSlug: "snippet",
          title: "useAuth Hook",
          description: "Custom authentication hook.",
          content: "export function useAuth() {}",
          url: null,
          language: "TypeScript",
          tags: ["react", "auth"],
        },
      },
      {
        findItemTypeBySlug: async (slug) => {
          calls.push(`findItemTypeBySlug:${slug}`);
          return {
            id: "type_snippet",
          };
        },
        createItemRecord: async (input) => {
          calls.push(
            `createItemRecord:${input.userId}:${input.data.itemTypeId}:${input.data.contentType}:${input.data.title}`,
          );
          assert.deepEqual(input.data, {
            title: "useAuth Hook",
            description: "Custom authentication hook.",
            contentType: "TEXT",
            content: "export function useAuth() {}",
            url: null,
            fileUrl: null,
            fileName: null,
            fileSize: null,
            language: "TypeScript",
            itemTypeId: "type_snippet",
          });
          return {
            id: "item_123",
          };
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
            isFavorite: false,
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
      "findItemTypeBySlug:snippet",
      "createItemRecord:user_123:type_snippet:TEXT:useAuth Hook",
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

  it("creates file items with file metadata and FILE content type", async () => {
    const { createItem } = await import("./items");

    await createItem(
      {
        userId: "user_123",
        data: {
          typeSlug: "file",
          title: "Architecture Notes",
          description: "System notes.",
          content: null,
          url: null,
          fileUrl: "devstash/api/uploads/dm/user_123/upload_123-architecture-notes.md",
          fileName: "architecture-notes.md",
          fileSize: 2048,
          language: null,
          tags: ["architecture"],
        },
      },
      {
        findItemTypeBySlug: async () => ({
          id: "type_file",
        }),
        createItemRecord: async (input) => {
          assert.deepEqual(input.data, {
            title: "Architecture Notes",
            description: "System notes.",
            contentType: "FILE",
            content: null,
            url: null,
            fileUrl: "devstash/api/uploads/dm/user_123/upload_123-architecture-notes.md",
            fileName: "architecture-notes.md",
            fileSize: 2048,
            language: null,
            itemTypeId: "type_file",
          });
          return {
            id: "item_file",
          };
        },
        upsertTag: async (input) => ({
          id: `tag_${input.slug}`,
        }),
        createItemTags: async () => undefined,
        findItemDetail: async () => null,
      },
    );
  });

  it("runs item creation and tag writes inside transaction-scoped dependencies", async () => {
    const { createItem } = await import("./items");
    const calls: string[] = [];
    const txDeps = {
      findItemTypeBySlug: async () => {
        calls.push("tx:findItemTypeBySlug");
        return {
          id: "type_snippet",
        };
      },
      createItemRecord: async () => {
        calls.push("tx:createItemRecord");
        return {
          id: "item_123",
        };
      },
      upsertTag: async (input: { slug: string }) => {
        calls.push(`tx:upsertTag:${input.slug}`);
        return {
          id: `tag_${input.slug}`,
        };
      },
      createItemTags: async () => {
        calls.push("tx:createItemTags");
      },
      findItemDetail: async () => {
        calls.push("tx:findItemDetail");
        return createItemDetailRecord();
      },
    };

    const result = await createItem(
      {
        userId: "user_123",
        data: {
          typeSlug: "snippet",
          title: "useAuth Hook",
          description: "Custom authentication hook.",
          content: "export function useAuth() {}",
          url: null,
          language: "TypeScript",
          tags: ["react"],
        },
      },
      {
        runTransaction: async (callback) => {
          calls.push("transaction:start");
          const result = await callback(txDeps);
          calls.push("transaction:end");
          return result;
        },
        findItemTypeBySlug: async () => {
          throw new Error("root findItemTypeBySlug should not be called");
        },
        createItemRecord: async () => {
          throw new Error("root createItemRecord should not be called");
        },
        upsertTag: async () => {
          throw new Error("root upsertTag should not be called");
        },
        createItemTags: async () => {
          throw new Error("root createItemTags should not be called");
        },
        findItemDetail: async () => {
          throw new Error("root findItemDetail should not be called");
        },
      },
    );

    assert.equal(result?.id, "item_123");
    assert.deepEqual(calls, [
      "transaction:start",
      "tx:findItemTypeBySlug",
      "tx:createItemRecord",
      "tx:upsertTag:react",
      "tx:createItemTags",
      "tx:findItemDetail",
      "transaction:end",
    ]);
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

  it("runs item updates and tag replacement inside transaction-scoped dependencies", async () => {
    const { updateItem } = await import("./items");
    const calls: string[] = [];
    const txDeps = {
      findOwnedItem: async () => {
        calls.push("tx:findOwnedItem");
        return {
          id: "item_123",
        };
      },
      updateItemFields: async () => {
        calls.push("tx:updateItemFields");
      },
      deleteItemTags: async () => {
        calls.push("tx:deleteItemTags");
      },
      upsertTag: async (input: { slug: string }) => {
        calls.push(`tx:upsertTag:${input.slug}`);
        return {
          id: `tag_${input.slug}`,
        };
      },
      createItemTags: async () => {
        calls.push("tx:createItemTags");
      },
      findItemDetail: async () => {
        calls.push("tx:findItemDetail");
        return createItemDetailRecord();
      },
    };

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
          tags: ["react"],
        },
      },
      {
        runTransaction: async (callback) => {
          calls.push("transaction:start");
          const result = await callback(txDeps);
          calls.push("transaction:end");
          return result;
        },
        findOwnedItem: async () => {
          throw new Error("root findOwnedItem should not be called");
        },
        updateItemFields: async () => {
          throw new Error("root updateItemFields should not be called");
        },
        deleteItemTags: async () => {
          throw new Error("root deleteItemTags should not be called");
        },
        upsertTag: async () => {
          throw new Error("root upsertTag should not be called");
        },
        createItemTags: async () => {
          throw new Error("root createItemTags should not be called");
        },
        findItemDetail: async () => {
          throw new Error("root findItemDetail should not be called");
        },
      },
    );

    assert.equal(result?.id, "item_123");
    assert.deepEqual(calls, [
      "transaction:start",
      "tx:findOwnedItem",
      "tx:updateItemFields",
      "tx:deleteItemTags",
      "tx:upsertTag:react",
      "tx:createItemTags",
      "tx:findItemDetail",
      "transaction:end",
    ]);
  });
});

describe("deleteItem", () => {
  it("does not delete items outside the signed-in user", async () => {
    const { deleteItem } = await import("./items");
    const result = await deleteItem(
      {
        itemId: "item_123",
        userId: "user_123",
      },
      {
        findOwnedItem: async () => null,
        deleteItemRecord: async () => {
          throw new Error("deleteItemRecord should not be called");
        },
      },
    );

    assert.equal(result, false);
  });

  it("deletes an item owned by the signed-in user", async () => {
    const { deleteItem } = await import("./items");
    const calls: string[] = [];
    const result = await deleteItem(
      {
        itemId: "item_123",
        userId: "user_123",
      },
      {
        findOwnedItem: async (input) => {
          calls.push(`findOwnedItem:${input.itemId}:${input.userId}`);
          return {
            id: input.itemId,
            fileUrl: null,
          };
        },
        deleteItemRecord: async (itemId) => {
          calls.push(`deleteItemRecord:${itemId}`);
        },
      },
    );

    assert.deepEqual(result, {
      id: "item_123",
      fileUrl: null,
    });
    assert.deepEqual(calls, [
      "findOwnedItem:item_123:user_123",
      "deleteItemRecord:item_123",
    ]);
  });

  it("returns deleted file metadata so storage can be cleaned up", async () => {
    const { deleteItem } = await import("./items");

    const result = await deleteItem(
      {
        itemId: "item_file",
        userId: "user_123",
      },
      {
        findOwnedItem: async () => ({
          id: "item_file",
          fileUrl: "devstash/api/uploads/dm/user_123/upload_123-architecture-notes.md",
        }),
        deleteItemRecord: async () => undefined,
      },
    );

    assert.deepEqual(result, {
      id: "item_file",
      fileUrl: "devstash/api/uploads/dm/user_123/upload_123-architecture-notes.md",
    });
  });
});

function createItemDetailRecord() {
  return {
    id: "item_123",
    title: "useAuth Hook",
    description: "Custom authentication hook.",
    contentType: "TEXT" as const,
    content: "export function useAuth() {}",
    url: null,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    language: "TypeScript",
    isPinned: false,
    isFavorite: false,
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
    tags: [{ tag: { name: "react", slug: "react" } }],
  };
}
