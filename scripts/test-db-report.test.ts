import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { seedCollections, seedItemTypes } from "../prisma/seed-data";
import {
  assertDemoDataMatchesSeedSpec,
  formatDemoDataReport,
} from "./test-db-report";

describe("formatDemoDataReport", () => {
  it("renders database metadata and nested demo data", () => {
    const report = formatDemoDataReport({
      host: "localhost:5432",
      database: "devstash",
      adapter: "pg",
      counts: {
        users: 1,
        itemTypes: 7,
        collections: 1,
        items: 2,
        tags: 3,
      },
      demoUser: {
        name: "Demo User",
        email: "demo@devstash.io",
        isPro: false,
        emailVerified: true,
        itemTypes: [
          {
            name: "snippet",
            slug: "snippet",
            icon: "Code",
            color: "#3b82f6",
          },
        ],
        collections: [
          {
            name: "React Patterns",
            slug: "react-patterns",
            description: "Reusable React patterns and hooks",
            items: [
              {
                id: "item_react_use_debounce",
                title: "useDebounce Hook",
                type: "snippet",
                contentType: "TEXT",
                tags: ["react", "hooks"],
              },
              {
                id: "item_design_tailwind_docs",
                title: "Tailwind CSS Documentation",
                type: "link",
                contentType: "URL",
                url: "https://tailwindcss.com/docs",
                tags: ["tailwind"],
              },
            ],
          },
        ],
      },
    });

    assert.match(report, /Database connection OK/);
    assert.match(report, /Host: localhost:5432/);
    assert.match(report, /Demo User: Demo User <demo@devstash.io>/);
    assert.match(report, /Email Verified: yes/);
    assert.match(report, /System Item Types \(1\)/);
    assert.match(report, /- snippet \(snippet\): Code #3b82f6/);
    assert.match(report, /Collections \(1\)/);
    assert.match(report, /- React Patterns \(react-patterns\)/);
    assert.match(report, /useDebounce Hook \[snippet\/TEXT\]/);
    assert.match(report, /Tailwind CSS Documentation \[link\/URL\] - https:\/\/tailwindcss.com\/docs/);
    assert.match(report, /tags: react, hooks/);
  });

  it("rejects demo data with extra items in a seeded collection", () => {
    const itemTypes = seedItemTypes.map((itemType) => ({
      name: itemType.name,
      slug: itemType.slug,
      icon: itemType.icon,
      color: itemType.color,
    }));
    const collections = seedCollections.map((collection) => ({
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      items: collection.items.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.typeSlug,
        contentType: item.url ? "URL" : "TEXT",
        tags: item.tags,
      })),
    }));
    const reactPatterns = collections.find((collection) => collection.slug === "react-patterns");

    assert.ok(reactPatterns);
    reactPatterns.items.push({
      id: "item_use_auth_hook",
      title: "useAuth Hook",
      type: "snippet",
      contentType: "TEXT",
      tags: ["react"],
    });

    assert.throws(
      () =>
        assertDemoDataMatchesSeedSpec({
          name: "Demo User",
          email: "demo@devstash.io",
          isPro: false,
          emailVerified: true,
          itemTypes,
          collections,
        }),
      /Unexpected items in React Patterns: item_use_auth_hook/,
    );
  });
});
