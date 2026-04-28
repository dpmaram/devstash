import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  buildProfileStats,
  formatProfileCreatedAt,
  toProfileAccountSummary,
  type ProfileItemCountRecord,
  type ProfileItemTypeRecord,
} from "./profile";

const itemTypes: ProfileItemTypeRecord[] = [
  {
    id: "type_command",
    name: "command",
    slug: "command",
    icon: "Terminal",
    color: "#f97316",
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
    id: "type_note",
    name: "note",
    slug: "note",
    icon: "StickyNote",
    color: "#fde047",
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
    id: "type_link",
    name: "link",
    slug: "link",
    icon: "Link",
    color: "#10b981",
  },
];

describe("buildProfileStats", () => {
  it("builds totals and item type counts in the profile spec order", () => {
    const itemCounts: ProfileItemCountRecord[] = [
      {
        itemTypeId: "type_prompt",
        _count: {
          _all: 3,
        },
      },
      {
        itemTypeId: "type_snippet",
        _count: {
          _all: 1,
        },
      },
    ];

    assert.deepEqual(
      buildProfileStats({
        collectionCount: 2,
        itemCounts,
        itemTypes,
      }),
      {
        totalCollections: 2,
        totalItems: 4,
        itemTypeBreakdown: [
          {
            id: "type_snippet",
            slug: "snippet",
            label: "Snippets",
            icon: "Code",
            color: "#3b82f6",
            count: 1,
          },
          {
            id: "type_prompt",
            slug: "prompt",
            label: "Prompts",
            icon: "Sparkles",
            color: "#8b5cf6",
            count: 3,
          },
          {
            id: "type_note",
            slug: "note",
            label: "Notes",
            icon: "StickyNote",
            color: "#fde047",
            count: 0,
          },
          {
            id: "type_command",
            slug: "command",
            label: "Commands",
            icon: "Terminal",
            color: "#f97316",
            count: 0,
          },
          {
            id: "type_link",
            slug: "link",
            label: "Links",
            icon: "Link",
            color: "#10b981",
            count: 0,
          },
          {
            id: "type_file",
            slug: "file",
            label: "Files",
            icon: "File",
            color: "#6b7280",
            count: 0,
          },
          {
            id: "type_image",
            slug: "image",
            label: "Images",
            icon: "Image",
            color: "#ec4899",
            count: 0,
          },
        ],
      },
    );
  });
});

describe("formatProfileCreatedAt", () => {
  it("formats the account creation date for display", () => {
    assert.equal(
      formatProfileCreatedAt(new Date("2026-04-01T12:00:00.000Z")),
      "Apr 1, 2026",
    );
  });
});

describe("toProfileAccountSummary", () => {
  it("marks credentials users as password-change eligible", () => {
    assert.deepEqual(
      toProfileAccountSummary({
        id: "user_123",
        name: "Ada Lovelace",
        email: "ada@example.com",
        image: null,
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
        passwordHash: "password-hash",
        accounts: [],
      }),
      {
        id: "user_123",
        name: "Ada Lovelace",
        email: "ada@example.com",
        image: null,
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
        createdAtLabel: "Apr 1, 2026",
        canChangePassword: true,
        authMethods: ["Email"],
      },
    );
  });

  it("hides password changes for OAuth-only users", () => {
    assert.deepEqual(
      toProfileAccountSummary({
        id: "user_123",
        name: "Ada Lovelace",
        email: "ada@example.com",
        image: "https://avatars.githubusercontent.com/u/123",
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
        passwordHash: null,
        accounts: [
          {
            provider: "github",
          },
        ],
      }),
      {
        id: "user_123",
        name: "Ada Lovelace",
        email: "ada@example.com",
        image: "https://avatars.githubusercontent.com/u/123",
        createdAt: new Date("2026-04-01T12:00:00.000Z"),
        createdAtLabel: "Apr 1, 2026",
        canChangePassword: false,
        authMethods: ["GitHub"],
      },
    );
  });
});
