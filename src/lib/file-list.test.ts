import { describe, expect, test } from "vitest";

import {
  formatFileListSize,
  getFileDownloadUrl,
  getFileExtensionLabel,
  getFileIconTone,
  shouldUseFileList,
} from "./file-list";

describe("shouldUseFileList", () => {
  test("uses the file list only for file item type pages", () => {
    expect(shouldUseFileList("file")).toBe(true);
    expect(shouldUseFileList("image")).toBe(false);
    expect(shouldUseFileList("snippet")).toBe(false);
    expect(shouldUseFileList(null)).toBe(false);
  });
});

describe("getFileDownloadUrl", () => {
  test("builds an authenticated attachment download URL", () => {
    expect(getFileDownloadUrl("item/file 123")).toBe(
      "/api/uploads/item%2Ffile%20123/download",
    );
  });
});

describe("formatFileListSize", () => {
  test("formats byte counts for the compact file list", () => {
    expect(formatFileListSize(512)).toBe("512 B");
    expect(formatFileListSize(2048)).toBe("2.0 KB");
    expect(formatFileListSize(3 * 1024 * 1024)).toBe("3.0 MB");
    expect(formatFileListSize(null)).toBe("Unknown size");
  });
});

describe("file extension helpers", () => {
  test("derive a visible extension label and icon tone from file names", () => {
    expect(getFileExtensionLabel("component.Context.TSX")).toBe("TSX");
    expect(getFileIconTone("component.Context.TSX")).toBe("code");
    expect(getFileExtensionLabel("system-diagram.png")).toBe("PNG");
    expect(getFileIconTone("system-diagram.png")).toBe("image");
    expect(getFileExtensionLabel("release-notes")).toBe("FILE");
    expect(getFileIconTone("release-notes")).toBe("default");
  });
});
