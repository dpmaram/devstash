import { describe, expect, test } from "vitest";

import {
  getCodeEditorLanguage,
  getCodeEditorLanguageLabel,
  shouldUseCodeEditor,
} from "./code-editor";

describe("shouldUseCodeEditor", () => {
  test("uses the code editor only for snippets and commands", () => {
    expect(shouldUseCodeEditor("snippet")).toBe(true);
    expect(shouldUseCodeEditor("command")).toBe(true);
    expect(shouldUseCodeEditor("note")).toBe(false);
    expect(shouldUseCodeEditor("prompt")).toBe(false);
    expect(shouldUseCodeEditor("link")).toBe(false);
    expect(shouldUseCodeEditor("file")).toBe(false);
    expect(shouldUseCodeEditor("image")).toBe(false);
  });
});

describe("getCodeEditorLanguage", () => {
  test("normalizes common saved language labels to Monaco language ids", () => {
    expect(getCodeEditorLanguage("TypeScript", "snippet")).toBe("typescript");
    expect(getCodeEditorLanguage("ts", "snippet")).toBe("typescript");
    expect(getCodeEditorLanguage("JavaScript", "snippet")).toBe("javascript");
    expect(getCodeEditorLanguage("shell", "command")).toBe("shell");
    expect(getCodeEditorLanguage("zsh", "command")).toBe("shell");
  });

  test("falls back by item type when language is empty or unknown", () => {
    expect(getCodeEditorLanguage("", "command")).toBe("shell");
    expect(getCodeEditorLanguage(null, "command")).toBe("shell");
    expect(getCodeEditorLanguage("", "snippet")).toBe("plaintext");
    expect(getCodeEditorLanguage("Not A Language", "snippet")).toBe("plaintext");
  });
});

describe("getCodeEditorLanguageLabel", () => {
  test("keeps the saved user-facing label when present", () => {
    expect(getCodeEditorLanguageLabel("TypeScript", "snippet")).toBe("TypeScript");
    expect(getCodeEditorLanguageLabel("zsh", "command")).toBe("zsh");
  });

  test("uses a readable fallback label", () => {
    expect(getCodeEditorLanguageLabel("", "command")).toBe("Shell");
    expect(getCodeEditorLanguageLabel(null, "snippet")).toBe("Plain text");
  });
});
