import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  sortDashboardItemTypes,
  toDashboardItem,
  toItemDetail,
  toDashboardItemType,
  type ItemDetailRecord,
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
    fileSize: null,
    language: "TypeScript",
    isPinned: true,
    isFavorite: true,
    createdAt: new Date("2026-01-15T12:30:00.000Z"),
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

function itemDetailRecord(
  overrides: Partial<ItemDetailRecord> = {},
): ItemDetailRecord {
  const baseItem = itemRecord();

  return {
    ...baseItem,
    contentType: "TEXT",
    content: baseItem.content ?? null,
    url: baseItem.url ?? null,
    fileName: baseItem.fileName ?? null,
    fileUrl: baseItem.fileUrl ?? null,
    createdAt: new Date("2026-01-15T12:30:00.000Z"),
    fileSize: null,
    language: baseItem.language ?? null,
    collections: [
      {
        collection: {
          id: "collection_react_patterns",
          name: "React Patterns",
          slug: "react-patterns",
        },
      },
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
      createdAtLabel: "Jan 15, 2026",
      updatedAt: "45 min ago",
      isPinned: true,
      isFavorite: true,
      fileName: null,
      fileSize: null,
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
        fileSize: 2048,
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
    assert.equal(fileItem.fileName, "component-context.md");
    assert.equal(fileItem.fileSize, 2048);
  });
});

describe("toItemDetail", () => {
  it("maps database item records to the drawer detail shape", () => {
    const item = toItemDetail(itemDetailRecord());

    assert.deepEqual(item, {
      id: "item_react_use_debounce",
      title: "useDebounce Hook",
      description: "Delay expensive reactions until a value has stopped changing.",
      contentType: "TEXT",
      content: "\nconst value = useDebounce(search, 300);\n",
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      language: "TypeScript",
      typeSlug: "snippet",
      itemType: snippetType,
      collections: [
        {
          id: "collection_react_patterns",
          name: "React Patterns",
          slug: "react-patterns",
        },
      ],
      tags: [
        { name: "react", slug: "react" },
        { name: "hooks", slug: "hooks" },
      ],
      createdAt: "2026-01-15T12:30:00.000Z",
      updatedAt: "2026-04-25T15:45:00.000Z",
      createdAtLabel: "January 15, 2026",
      updatedAtLabel: "April 25, 2026",
      isPinned: true,
      isFavorite: true,
      accentColor: "#3b82f6",
    });
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
