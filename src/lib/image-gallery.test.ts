import { describe, expect, test } from "vitest";

import {
  getImageThumbnailUrl,
  shouldUseImageGallery,
} from "./image-gallery";

describe("shouldUseImageGallery", () => {
  test("uses the image gallery only for image item type pages", () => {
    expect(shouldUseImageGallery("image")).toBe(true);
    expect(shouldUseImageGallery("file")).toBe(false);
    expect(shouldUseImageGallery("snippet")).toBe(false);
    expect(shouldUseImageGallery(null)).toBe(false);
  });
});

describe("getImageThumbnailUrl", () => {
  test("builds an inline authenticated download URL for thumbnails", () => {
    expect(getImageThumbnailUrl("item/image 123")).toBe(
      "/api/uploads/item%2Fimage%20123/download?disposition=inline",
    );
  });
});
