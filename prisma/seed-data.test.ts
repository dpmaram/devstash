import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  seedCollections,
  seedItemTypes,
  seedUser,
  type SeedItem,
} from "./seed-data";

describe("seed data", () => {
  it("defines the demo user from the seed specification", () => {
    assert.deepEqual(seedUser, {
      email: "demo@devstash.io",
      name: "Demo User",
      password: "12345678",
      isPro: false,
    });
  });

  it("defines every system item type from the seed specification", () => {
    assert.deepEqual(seedItemTypes, [
      { id: "type_snippet", name: "snippet", slug: "snippet", icon: "Code", color: "#3b82f6" },
      { id: "type_prompt", name: "prompt", slug: "prompt", icon: "Sparkles", color: "#8b5cf6" },
      { id: "type_command", name: "command", slug: "command", icon: "Terminal", color: "#f97316" },
      { id: "type_note", name: "note", slug: "note", icon: "StickyNote", color: "#fde047" },
      { id: "type_file", name: "file", slug: "file", icon: "File", color: "#6b7280" },
      { id: "type_image", name: "image", slug: "image", icon: "Image", color: "#ec4899" },
      { id: "type_link", name: "link", slug: "link", icon: "Link", color: "#10b981" },
    ]);
  });

  it("defines the required collections with the required item mix", () => {
    const itemTypesByCollection = Object.fromEntries(
      seedCollections.map((collection) => [
        collection.slug,
        collection.items.map((item: SeedItem) => item.typeSlug),
      ]),
    );

    assert.deepEqual(Object.keys(itemTypesByCollection), [
      "react-patterns",
      "ai-workflows",
      "devops",
      "terminal-commands",
      "design-resources",
    ]);
    assert.deepEqual(itemTypesByCollection["react-patterns"], [
      "snippet",
      "snippet",
      "snippet",
    ]);
    assert.deepEqual(itemTypesByCollection["ai-workflows"], ["prompt", "prompt", "prompt"]);
    assert.deepEqual(itemTypesByCollection["devops"], ["snippet", "command", "link", "link"]);
    assert.deepEqual(itemTypesByCollection["terminal-commands"], [
      "command",
      "command",
      "command",
      "command",
    ]);
    assert.deepEqual(itemTypesByCollection["design-resources"], ["link", "link", "link", "link"]);
  });

  it("uses real URLs for seeded links", () => {
    const links = seedCollections.flatMap((collection) =>
      collection.items.filter((item) => item.typeSlug === "link"),
    );

    assert.equal(links.length, 6);

    for (const link of links) {
      assert.match(link.url ?? "", /^https:\/\/[^\s]+$/);
    }
  });
});
