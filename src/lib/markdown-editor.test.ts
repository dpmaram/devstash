import { describe, expect, test } from "vitest";

import {
  getMarkdownEditorHeight,
  shouldUseMarkdownEditor,
} from "./markdown-editor";

describe("shouldUseMarkdownEditor", () => {
  test("uses the markdown editor only for notes and prompts", () => {
    expect(shouldUseMarkdownEditor("note")).toBe(true);
    expect(shouldUseMarkdownEditor("prompt")).toBe(true);
    expect(shouldUseMarkdownEditor("snippet")).toBe(false);
    expect(shouldUseMarkdownEditor("command")).toBe(false);
    expect(shouldUseMarkdownEditor("link")).toBe(false);
    expect(shouldUseMarkdownEditor("file")).toBe(false);
    expect(shouldUseMarkdownEditor("image")).toBe(false);
    expect(shouldUseMarkdownEditor(null)).toBe(false);
    expect(shouldUseMarkdownEditor(undefined)).toBe(false);
  });
});

describe("getMarkdownEditorHeight", () => {
  test("caps markdown editor height at 400 pixels", () => {
    const longMarkdown = Array.from({ length: 80 }, (_, index) => {
      return `Line ${index + 1}`;
    }).join("\n");

    expect(getMarkdownEditorHeight(longMarkdown)).toBe("400px");
  });

  test("gives short markdown enough room to render formatted preview", () => {
    expect(getMarkdownEditorHeight("# Short note")).toBe("320px");
  });
});
