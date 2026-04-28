import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  sortDashboardItemTypes,
  toDashboardItem,
  toDashboardItemType,
  type ItemRecord,
} from "./item-shaping";

const now = new Date("2026-04-25T16:30:00.000Z");

const snippetType = {
  id: "type_snippet",
  name: "snippet",
  slug: "snippet",
  icon: "Code",
  color: "#3b82f6",
};

function itemRecord(overrides: Partial<ItemRecord> = {}): ItemRecord {
  return {
    id: "item_react_use_debounce",
    title: "useDebounce Hook",
    description: "Delay expensive reactions until a value has stopped changing.",
    content: "\nconst value = useDebounce(search, 300);\n",
    url: null,
    fileName: null,
    fileUrl: null,
    language: "TypeScript",
    isPinned: true,
    isFavorite: true,
    updatedAt: new Date("2026-04-25T15:45:00.000Z"),
    itemType: snippetType,
    collections: [
      {
        collection: {
          name: "React Patterns",
          slug: "react-patterns",
        },
      },
    ],
    tags: [
      { tag: { name: "react", slug: "react" } },
      { tag: { name: "hooks", slug: "hooks" } },
    ],
    ...overrides,
  };
}

describe("toDashboardItem", () => {
  it("maps database item records to the dashboard item shape", () => {
    const item = toDashboardItem(itemRecord(), now);

    assert.deepEqual(item, {
      id: "item_react_use_debounce",
      title: "useDebounce Hook",
      description: "Delay expensive reactions until a value has stopped changing.",
      typeSlug: "snippet",
      itemType: snippetType,
      collectionSlugs: ["react-patterns"],
      collectionNames: ["React Patterns"],
      tags: ["react", "hooks"],
      updatedAt: "45 min ago",
      isPinned: true,
      isFavorite: true,
      language: "TypeScript",
      preview: "const value = useDebounce(search, 300);",
      accentColor: "#3b82f6",
    });
  });

  it("uses URL and file fields as preview fallbacks", () => {
    const linkItem = toDashboardItem(
      itemRecord({
        id: "item_tailwind_docs",
        content: null,
        url: "https://tailwindcss.com/docs",
        fileName: null,
        fileUrl: null,
        language: null,
        itemType: {
          id: "type_link",
          name: "link",
          slug: "link",
          icon: "Link",
          color: "#10b981",
        },
      }),
      now,
    );
    const fileItem = toDashboardItem(
      itemRecord({
        id: "item_context_template",
        content: null,
        url: null,
        fileName: "component-context.md",
        fileUrl: "https://example.com/component-context.md",
        language: null,
        itemType: {
          id: "type_file",
          name: "file",
          slug: "file",
          icon: "File",
          color: "#6b7280",
        },
      }),
      now,
    );

    assert.equal(linkItem.preview, "https://tailwindcss.com/docs");
    assert.equal(fileItem.preview, "component-context.md");
  });
});

describe("toDashboardItemType", () => {
  it("formats system item types for the dashboard sidebar", () => {
    const itemType = toDashboardItemType({
      id: "type_snippet",
      name: "snippet",
      slug: "snippet",
      icon: "Code",
      color: "#3b82f6",
      itemCount: 12,
    });

    assert.deepEqual(itemType, {
      id: "type_snippet",
      name: "snippet",
      slug: "snippet",
      label: "Snippets",
      href: "/items/snippets",
      icon: "Code",
      color: "#3b82f6",
      itemCount: 12,
    });
  });

  it("pluralizes image item type links naturally", () => {
    const itemType = toDashboardItemType({
      id: "type_image",
      name: "image",
      slug: "image",
      icon: "Image",
      color: "#ec4899",
      itemCount: 2,
    });

    assert.equal(itemType.label, "Images");
    assert.equal(itemType.href, "/items/images");
  });
});

describe("sortDashboardItemTypes", () => {
  it("orders item types for the dashboard sidebar", () => {
    const itemTypes = [
      {
        id: "type_link",
        name: "link",
        slug: "link",
        icon: "Link",
        color: "#10b981",
      },
      {
        id: "type_file",
        name: "file",
        slug: "file",
        icon: "File",
        color: "#6b7280",
      },
      {
        id: "type_prompt",
        name: "prompt",
        slug: "prompt",
        icon: "Sparkles",
        color: "#8b5cf6",
      },
      {
        id: "type_note",
        name: "note",
        slug: "note",
        icon: "StickyNote",
        color: "#fde047",
      },
      {
        id: "type_snippet",
        name: "snippet",
        slug: "snippet",
        icon: "Code",
        color: "#3b82f6",
      },
      {
        id: "type_image",
        name: "image",
        slug: "image",
        icon: "Image",
        color: "#ec4899",
      },
      {
        id: "type_command",
        name: "command",
        slug: "command",
        icon: "Terminal",
        color: "#f97316",
      },
    ];

    const sortedSlugs = sortDashboardItemTypes(itemTypes).map(
      (itemType) => itemType.slug,
    );

    assert.deepEqual(sortedSlugs, [
      "snippet",
      "prompt",
      "command",
      "note",
      "file",
      "image",
      "link",
    ]);
  });
});
