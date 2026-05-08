import { describe, it, expect } from "vitest";

import { getDefaultEditorPreferences } from "./editor-preferences";

describe("editor-preferences utilities", () => {
  describe("getDefaultEditorPreferences", () => {
    it("should return default preferences with expected values", () => {
      const defaults = getDefaultEditorPreferences();

      expect(defaults).toEqual({
        fontSize: 14,
        tabSize: 2,
        wordWrap: true,
        minimap: false,
        theme: "vs-dark",
      });
    });

    it("should return a new object each time (not a singleton reference)", () => {
      const defaults1 = getDefaultEditorPreferences();
      const defaults2 = getDefaultEditorPreferences();

      expect(defaults1).toEqual(defaults2);
      expect(defaults1).not.toBe(defaults2);
    });

    it("should have valid theme value", () => {
      const defaults = getDefaultEditorPreferences();
      const validThemes = ["vs-dark", "monokai", "github-dark"];
      expect(validThemes).toContain(defaults.theme);
    });

    it("should have font size within allowed range", () => {
      const defaults = getDefaultEditorPreferences();
      expect(defaults.fontSize).toBeGreaterThanOrEqual(8);
      expect(defaults.fontSize).toBeLessThanOrEqual(32);
    });

    it("should have tab size within allowed range", () => {
      const defaults = getDefaultEditorPreferences();
      expect(defaults.tabSize).toBeGreaterThanOrEqual(1);
      expect(defaults.tabSize).toBeLessThanOrEqual(8);
    });
  });
});
