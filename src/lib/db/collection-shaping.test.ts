import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDashboardStats,
  toDashboardCollection,
  type CollectionRecord,
} from "./collection-shaping";

const baseDate = new Date("2026-04-25T14:30:00.000Z");

function itemType(slug: string, color: string, icon = "Circle") {
  return {
    id: `type_${slug}`,
    name: slug,
    slug,
    icon,
    color,
  };
}

function collectionRecord(
  overrides: Partial<CollectionRecord> = {},
): CollectionRecord {
  return {
    id: "collection_1",
    name: "Launch Recipes",
    slug: "launch-recipes",
    description: "Deploy flows and release commands.",
    isFavorite: true,
    updatedAt: baseDate,
    defaultType: itemType("note", "#fde047", "StickyNote"),
    items: [
      { item: { id: "item_1", itemType: itemType("snippet", "#3b82f6", "Code") } },
      { item: { id: "item_2", itemType: itemType("snippet", "#3b82f6", "Code") } },
      { item: { id: "item_3", itemType: itemType("command", "#f97316", "Terminal") } },
    ],
    ...overrides,
  };
}

describe("toDashboardCollection", () => {
  it("uses the most common item type for the card accent and preserves each present type once", () => {
    const collection = toDashboardCollection(collectionRecord(), baseDate);

    assert.equal(collection.accentColor, "#3b82f6");
    assert.equal(collection.itemCount, 3);
    assert.deepEqual(
      collection.types.map((type) => ({
        slug: type.slug,
        name: type.name,
        icon: type.icon,
        color: type.color,
      })),
      [
        { slug: "snippet", name: "snippet", icon: "Code", color: "#3b82f6" },
        { slug: "command", name: "command", icon: "Terminal", color: "#f97316" },
      ],
    );
  });

  it("uses the default type for empty collections", () => {
    const collection = toDashboardCollection(
      collectionRecord({
        items: [],
        defaultType: itemType("link", "#10b981", "Link"),
      }),
      baseDate,
    );

    assert.equal(collection.accentColor, "#10b981");
    assert.deepEqual(collection.types, [
      {
        id: "type_link",
        slug: "link",
        name: "link",
        icon: "Link",
        color: "#10b981",
      },
    ]);
    assert.equal(collection.itemCount, 0);
  });
});

describe("buildDashboardStats", () => {
  it("formats database-backed dashboard stats", () => {
    const stats = buildDashboardStats({
      itemCount: 28,
      collectionCount: 6,
      favoriteCollectionCount: 2,
      pinnedItemCount: 4,
      promptItemCount: 7,
    });

    assert.deepEqual(stats, [
      { label: "Items", value: "28", detail: "Saved total" },
      { label: "Collections", value: "6", detail: "2 favorites" },
      { label: "Pinned", value: "4", detail: "Top shelf" },
      { label: "Prompts", value: "7", detail: "AI-ready" },
    ]);
  });
});
