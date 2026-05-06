import assert from "node:assert/strict";
import { describe, it } from "vitest";

import type { ItemDetail } from "./lib/db/items";

process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/devstash";

const fileItem: ItemDetail = {
  id: "item_file",
  title: "Architecture Notes",
  description: "System notes.",
  contentType: "FILE",
  content: null,
  url: null,
  fileUrl: "devstash/api/uploads/dm/user_123/upload_123-architecture-notes.md",
  fileName: "architecture-notes.md",
  fileSize: 11,
  language: undefined,
  typeSlug: "file",
  itemType: {
    id: "type_file",
    name: "file",
    slug: "file",
    icon: "File",
    color: "#6b7280",
  },
  collections: [],
  tags: [],
  createdAt: "2026-01-15T12:30:00.000Z",
  updatedAt: "2026-04-25T15:45:00.000Z",
  createdAtLabel: "January 15, 2026",
  updatedAtLabel: "April 25, 2026",
  isPinned: false,
  isFavorite: false,
  accentColor: "#6b7280",
};

describe("upload download route", () => {
  it("exports a GET handler", async () => {
    const route = await import("./app/api/uploads/[id]/download/route");

    assert.equal(typeof route.GET, "function");
  });

  it("streams stored files through an authenticated item lookup", async () => {
    const route = (await import("./app/api/uploads/[id]/download/route")) as typeof import("./app/api/uploads/[id]/download/route") & {
      handleDownloadFile: (
        request: Request,
        context: { params: Promise<{ id: string }> },
        deps: {
          auth: () => Promise<{ user: { id: string } }>;
          getDashboardUserForSession: (sessionUser: {
            id: string;
          }) => Promise<{ id: string }>;
          getItemDetail: (input: {
            itemId: string;
            userId: string;
          }) => Promise<ItemDetail | null>;
          getStoredFile: (fileUrl: string) => Promise<{
            body: Uint8Array;
            contentLength: number;
            contentType: string;
          } | null>;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleDownloadFile(
      new Request("http://localhost/api/uploads/item_file/download"),
      {
        params: Promise.resolve({ id: "item_file" }),
      },
      {
        auth: async () => ({
          user: {
            id: "signed_in_user",
          },
        }),
        getDashboardUserForSession: async (sessionUser) => {
          assert.deepEqual(sessionUser, {
            id: "signed_in_user",
          });
          return {
            id: "user_123",
          };
        },
        getItemDetail: async (input) => {
          assert.deepEqual(input, {
            itemId: "item_file",
            userId: "user_123",
          });
          return fileItem;
        },
        getStoredFile: async (fileUrl) => {
          assert.equal(
            fileUrl,
            "devstash/api/uploads/dm/user_123/upload_123-architecture-notes.md",
          );
          return {
            body: new TextEncoder().encode("hello world"),
            contentLength: 11,
            contentType: "text/markdown",
          };
        },
      },
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/markdown");
    assert.equal(response.headers.get("content-length"), "11");
    assert.equal(
      response.headers.get("content-disposition"),
      'attachment; filename="architecture-notes.md"',
    );
    assert.equal(await response.text(), "hello world");
  });

  it("returns 404 when the item has no stored file", async () => {
    const route = (await import("./app/api/uploads/[id]/download/route")) as typeof import("./app/api/uploads/[id]/download/route") & {
      handleDownloadFile: (
        request: Request,
        context: { params: Promise<{ id: string }> },
        deps: {
          auth: () => Promise<{ user: { id: string } }>;
          getDashboardUserForSession: () => Promise<{ id: string }>;
          getItemDetail: () => Promise<ItemDetail | null>;
          getStoredFile: () => Promise<never>;
        },
      ) => Promise<Response>;
    };

    const response = await route.handleDownloadFile(
      new Request("http://localhost/api/uploads/item_file/download"),
      {
        params: Promise.resolve({ id: "item_file" }),
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
        getItemDetail: async () => ({
          ...fileItem,
          fileUrl: null,
        }),
        getStoredFile: async () => {
          throw new Error("getStoredFile should not be called");
        },
      },
    );

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      success: false,
      error: "File not found.",
    });
  });
});
