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

describe("createItem action", () => {
  it("rejects invalid payloads before auth or database writes", async () => {
    const { handleCreateItem } = await import("./items");

    const result = await handleCreateItem(
      {
        typeSlug: "link",
        title: "Tailwind Docs",
        url: "",
        tags: ["docs"],
      },
      {
        auth: async () => {
          throw new Error("auth should not be called");
        },
        createItem: async () => {
          throw new Error("createItem should not be called");
        },
        getDashboardUserForSession: async () => {
          throw new Error("getDashboardUserForSession should not be called");
        },
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "URL is required.",
    });
  });

  it("requires a signed-in user", async () => {
    const { handleCreateItem } = await import("./items");

    const result = await handleCreateItem(
      {
        typeSlug: "note",
        title: "Release notes",
        tags: ["release"],
      },
      {
        auth: async () => null,
        createItem: async () => {
          throw new Error("createItem should not be called");
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

  it("creates the resolved dashboard user's item with normalized type-specific data", async () => {
    const { handleCreateItem } = await import("./items");

    const result = await handleCreateItem(
      {
        typeSlug: "snippet",
        title: "  useAuth Hook  ",
        description: "  Custom hook  ",
        content: "  export function useAuth() {}  ",
        url: "https://example.com/ignored",
        language: "  TypeScript  ",
        tags: ["react", "hooks"],
      },
      {
        auth: async () => ({
          user: {
            id: "signed_in_user",
          },
        }),
        createItem: async (input) => {
          assert.deepEqual(input, {
            userId: "demo_user",
            data: {
              typeSlug: "snippet",
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
        getDashboardUserForSession: async (sessionUser) => {
          assert.deepEqual(sessionUser, {
            id: "signed_in_user",
          });
          return {
            id: "demo_user",
          };
        },
      },
    );

    assert.deepEqual(result, {
      success: true,
      data: itemDetail,
    });
  });

  it("passes selected collection ids when creating an item", async () => {
    const { handleCreateItem } = await import("./items");

    const result = await handleCreateItem(
      {
        typeSlug: "note",
        title: "Release checklist",
        content: "Ship it.",
        collectionIds: [" collection_alpha ", "collection_alpha", "collection_beta"],
      },
      {
        auth: async () => ({
          user: {
            id: "user_123",
          },
        }),
        createItem: async (input) => {
          assert.deepEqual(input, {
            userId: "user_123",
            data: {
              typeSlug: "note",
              title: "Release checklist",
              description: null,
              content: "Ship it.",
              url: null,
              language: null,
              tags: [],
              collectionIds: ["collection_alpha", "collection_beta"],
            },
          });
          return itemDetail;
        },
        getDashboardUserForSession: async () => ({
          id: "user_123",
        }),
      },
    );

    assert.deepEqual(result, {
      success: true,
      data: itemDetail,
    });
  });

  it("creates file items with uploaded file metadata", async () => {
    const { handleCreateItem } = await import("./items");

    const fileDetail: ItemDetail = {
      ...itemDetail,
      id: "item_file",
      title: "Architecture Notes",
      contentType: "FILE",
      content: null,
      fileUrl: "devstash/api/uploads/dm/demo_user/upload_123-architecture-notes.md",
      fileName: "architecture-notes.md",
      fileSize: 2048,
      language: undefined,
      typeSlug: "file",
      itemType: {
        id: "type_file",
        name: "file",
        slug: "file",
        icon: "File",
        color: "#6b7280",
      },
    };

    const result = await handleCreateItem(
      {
        typeSlug: "file",
        title: "  Architecture Notes  ",
        description: "  System notes  ",
        fileUrl: "devstash/api/uploads/dm/demo_user/upload_123-architecture-notes.md",
        fileName: "  architecture-notes.md  ",
        fileSize: 2048,
        tags: ["architecture"],
      },
      {
        auth: async () => ({
          user: {
            id: "signed_in_user",
          },
        }),
        createItem: async (input) => {
          assert.deepEqual(input, {
            userId: "demo_user",
            data: {
              typeSlug: "file",
              title: "Architecture Notes",
              description: "System notes",
              content: null,
              url: null,
              fileUrl: "devstash/api/uploads/dm/demo_user/upload_123-architecture-notes.md",
              fileName: "architecture-notes.md",
              fileSize: 2048,
              language: null,
              tags: ["architecture"],
            },
          });
          return fileDetail;
        },
        getDashboardUserForSession: async () => ({
          id: "demo_user",
        }),
      },
    );

    assert.deepEqual(result, {
      success: true,
      data: fileDetail,
    });
  });

  it("rejects uploaded file metadata that is outside the resolved user's upload scope", async () => {
    const { handleCreateItem } = await import("./items");

    const result = await handleCreateItem(
      {
        typeSlug: "file",
        title: "Architecture Notes",
        fileUrl: "devstash/api/uploads/dm/other_user/upload_123-architecture-notes.md",
        fileName: "architecture-notes.md",
        fileSize: 2048,
        tags: ["architecture"],
      },
      {
        auth: async () => ({
          user: {
            id: "user_123",
          },
        }),
        createItem: async () => {
          throw new Error("createItem should not be called");
        },
        getDashboardUserForSession: async () => ({
          id: "user_123",
        }),
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "Upload is not available for this user.",
    });
  });

  it("requires uploaded file metadata for file and image items", async () => {
    const { handleCreateItem } = await import("./items");

    const result = await handleCreateItem(
      {
        typeSlug: "image",
        title: "Screenshot",
      },
      {
        auth: async () => {
          throw new Error("auth should not be called");
        },
        createItem: async () => {
          throw new Error("createItem should not be called");
        },
        getDashboardUserForSession: async () => {
          throw new Error("getDashboardUserForSession should not be called");
        },
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "Upload is required.",
    });
  });

  it("returns a create error when the data layer cannot create the item", async () => {
    const { handleCreateItem } = await import("./items");

    const result = await handleCreateItem(
      {
        typeSlug: "prompt",
        title: "Prompt optimizer",
        content: "Improve this prompt.",
        tags: ["prompting"],
      },
      {
        auth: async () => ({
          user: {
            id: "user_123",
          },
        }),
        createItem: async () => null,
        getDashboardUserForSession: async () => ({
          id: "user_123",
        }),
      },
    );

    assert.deepEqual(result, {
      success: false,
      error: "Unable to create item.",
    });
  });
});

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

  it("passes selected collection ids when updating an item", async () => {
    const { handleUpdateItem } = await import("./items");

    const result = await handleUpdateItem(
      "item_123",
      {
        title: "useAuth Hook",
        description: "",
        content: "export function useAuth() {}",
        url: "",
        language: "TypeScript",
        tags: ["react"],
        collectionIds: ["collection_beta", "collection_beta", " collection_gamma "],
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
        updateItem: async (input) => {
          assert.deepEqual(input, {
            itemId: "item_123",
            userId: "user_123",
            data: {
              title: "useAuth Hook",
              description: null,
              content: "export function useAuth() {}",
              url: null,
              language: "TypeScript",
              tags: ["react"],
              collectionIds: ["collection_beta", "collection_gamma"],
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

describe("deleteItem action", () => {
  it("rejects blank item ids before auth or database writes", async () => {
    const { handleDeleteItem } = await import("./items");

    const result = await handleDeleteItem("   ", {
      auth: async () => {
        throw new Error("auth should not be called");
      },
      deleteItem: async () => {
        throw new Error("deleteItem should not be called");
      },
      getDashboardUserForSession: async () => {
        throw new Error("getDashboardUserForSession should not be called");
      },
    });

    assert.deepEqual(result, {
      success: false,
      error: "Item id is required.",
    });
  });

  it("requires a signed-in user", async () => {
    const { handleDeleteItem } = await import("./items");

    const result = await handleDeleteItem("item_123", {
      auth: async () => null,
      deleteItem: async () => {
        throw new Error("deleteItem should not be called");
      },
      getDashboardUserForSession: async () => {
        throw new Error("getDashboardUserForSession should not be called");
      },
    });

    assert.deepEqual(result, {
      success: false,
      error: "You must be signed in.",
    });
  });

  it("deletes the resolved dashboard user's item", async () => {
    const { handleDeleteItem } = await import("./items");

    const result = await handleDeleteItem(" item_123 ", {
      auth: async () => ({
        user: {
          id: "empty_user",
        },
      }),
      deleteItem: async (input) => {
        assert.deepEqual(input, {
          itemId: "item_123",
          userId: "demo_user",
        });
        return {
          id: "item_123",
          fileUrl: null,
        };
      },
      getDashboardUserForSession: async (sessionUser) => {
        assert.deepEqual(sessionUser, {
          id: "empty_user",
        });
        return {
          id: "demo_user",
        };
      },
    });

    assert.deepEqual(result, {
      success: true,
    });
  });

  it("deletes stored files after deleting file items", async () => {
    const { handleDeleteItem } = await import("./items");
    const deletedFiles: string[] = [];

    const result = await handleDeleteItem("item_file", {
      auth: async () => ({
        user: {
          id: "user_123",
        },
      }),
      deleteItem: async () => ({
        id: "item_file",
        fileUrl: "devstash/api/uploads/dm/user_123/upload_123-architecture-notes.md",
      }),
      deleteStoredFile: async (fileUrl) => {
        deletedFiles.push(fileUrl);
      },
      getDashboardUserForSession: async () => ({
        id: "user_123",
      }),
    });

    assert.deepEqual(result, {
      success: true,
    });
    assert.deepEqual(deletedFiles, [
      "devstash/api/uploads/dm/user_123/upload_123-architecture-notes.md",
    ]);
  });

  it("returns a not-found error for items outside the resolved dashboard user", async () => {
    const { handleDeleteItem } = await import("./items");

    const result = await handleDeleteItem("item_123", {
      auth: async () => ({
        user: {
          id: "user_123",
        },
      }),
      deleteItem: async () => false,
      getDashboardUserForSession: async () => ({
        id: "user_123",
      }),
    });

    assert.deepEqual(result, {
      success: false,
      error: "Item not found.",
    });
  });
});
