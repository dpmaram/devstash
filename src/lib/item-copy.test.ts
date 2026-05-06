import { describe, expect, test } from "vitest";

import { getQuickCopyText, type QuickCopyItem } from "./item-copy";

function item(overrides: Partial<QuickCopyItem> = {}): QuickCopyItem {
  return {
    fileName: null,
    id: "item_123",
    preview: "const value = useDebounce(search, 300);",
    title: "useDebounce Hook",
    typeSlug: "snippet",
    ...overrides,
  };
}

describe("getQuickCopyText", () => {
  test("copies the dashboard preview for text and link items", () => {
    expect(getQuickCopyText(item())).toBe(
      "const value = useDebounce(search, 300);",
    );
    expect(
      getQuickCopyText(
        item({
          preview: "https://tailwindcss.com/docs",
          title: "Tailwind Docs",
          typeSlug: "link",
        }),
      ),
    ).toBe("https://tailwindcss.com/docs");
  });

  test("falls back to the title when an item has no preview", () => {
    expect(getQuickCopyText(item({ preview: "   ", title: "Untitled note" }))).toBe(
      "Untitled note",
    );
  });

  test("copies authenticated download URLs for uploaded file types", () => {
    expect(
      getQuickCopyText(
        item({
          id: "item/file 123",
          preview: "architecture-notes.md",
          title: "Architecture Notes",
          typeSlug: "file",
        }),
      ),
    ).toBe("/api/uploads/item%2Ffile%20123/download");

    expect(
      getQuickCopyText(
        item({
          id: "item/image 123",
          preview: "screenshot.png",
          title: "Screenshot",
          typeSlug: "image",
        }),
      ),
    ).toBe("/api/uploads/item%2Fimage%20123/download");
  });
});
