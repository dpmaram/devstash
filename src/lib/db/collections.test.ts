import assert from "node:assert/strict";
import { describe, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

function collectionRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "collection_123",
    name: "Launch Recipes",
    slug: "launch-recipes",
    description: "Deploy flows and release commands.",
    isFavorite: false,
    updatedAt: new Date("2026-05-06T12:00:00.000Z"),
    defaultType: null,
    _count: {
      items: 0,
    },
    ...overrides,
  };
}

describe("slugifyCollectionName", () => {
  it("creates stable collection slugs from user-facing names", async () => {
    const { slugifyCollectionName } = await import("./collections");

    assert.equal(slugifyCollectionName("  Launch Recipes!!  "), "launch-recipes");
    assert.equal(slugifyCollectionName("###"), "collection");
  });
});

describe("createCollection", () => {
  it("creates a user-scoped collection with trimmed data and a normalized slug", async () => {
    const { createCollection } = await import("./collections");
    const calls: string[] = [];

    const collection = await createCollection(
      {
        userId: "user_123",
        data: {
          name: "  Launch Recipes  ",
          description: "  Deploy flows and release commands.  ",
        },
      },
      {
        findCollectionBySlug: async (input) => {
          calls.push(`findCollectionBySlug:${input.userId}:${input.slug}`);
          return null;
        },
        createCollectionRecord: async (input) => {
          calls.push(
            `createCollectionRecord:${input.userId}:${input.data.name}:${input.data.slug}:${input.data.description}`,
          );
          return {
            id: "collection_123",
          };
        },
        findCollectionById: async (input) => {
          calls.push(`findCollectionById:${input.userId}:${input.collectionId}`);
          return collectionRecord();
        },
      },
    );

    assert.deepEqual(calls, [
      "findCollectionBySlug:user_123:launch-recipes",
      "createCollectionRecord:user_123:Launch Recipes:launch-recipes:Deploy flows and release commands.",
      "findCollectionById:user_123:collection_123",
    ]);
    assert.equal(collection?.id, "collection_123");
    assert.equal(collection?.slug, "launch-recipes");
    assert.equal(collection?.description, "Deploy flows and release commands.");
  });

  it("does not create a duplicate collection for the same user and slug", async () => {
    const { createCollection } = await import("./collections");

    const collection = await createCollection(
      {
        userId: "user_123",
        data: {
          name: "Launch Recipes",
          description: null,
        },
      },
      {
        findCollectionBySlug: async () => ({
          id: "existing_collection",
        }),
        createCollectionRecord: async () => {
          throw new Error("createCollectionRecord should not be called");
        },
        findCollectionById: async () => {
          throw new Error("findCollectionById should not be called");
        },
      },
    );

    assert.equal(collection, null);
  });
});
