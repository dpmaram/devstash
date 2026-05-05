import { describe, expect, test } from "vitest";

import {
  buildUploadObjectKey,
  validateUploadCandidate,
} from "./uploads";

describe("validateUploadCandidate", () => {
  test("accepts image files within the image constraints", () => {
    expect(
      validateUploadCandidate(
        {
          name: "architecture.PNG",
          size: 5 * 1024 * 1024,
          type: "image/png",
        },
        "image",
      ),
    ).toEqual({ success: true });
  });

  test("rejects images over 5 MB", () => {
    expect(
      validateUploadCandidate(
        {
          name: "huge.webp",
          size: 5 * 1024 * 1024 + 1,
          type: "image/webp",
        },
        "image",
      ),
    ).toEqual({
      success: false,
      error: "Images must be 5 MB or smaller.",
    });
  });

  test("accepts configured document file types within 10 MB", () => {
    expect(
      validateUploadCandidate(
        {
          name: "release-notes.md",
          size: 1024,
          type: "text/markdown",
        },
        "file",
      ),
    ).toEqual({ success: true });
  });

  test("rejects mismatched file extensions and mime types", () => {
    expect(
      validateUploadCandidate(
        {
          name: "script.exe",
          size: 1024,
          type: "application/octet-stream",
        },
        "file",
      ),
    ).toEqual({
      success: false,
      error: "That file type is not supported.",
    });
  });
});

describe("buildUploadObjectKey", () => {
  test("builds user-scoped keys with sanitized filenames", () => {
    expect(
      buildUploadObjectKey({
        fileName: "../My File (Final).PDF",
        uploadId: "upload_123",
        userId: "user_123",
      }),
    ).toBe("uploads/user_123/upload_123-my-file-final.pdf");
  });
});
