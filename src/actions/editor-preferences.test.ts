import { describe, it, expect } from "vitest";

import { EditorPreferencesSchema } from "@/lib/editor-preferences";

describe("editor-preferences server actions", () => {
  describe("EditorPreferencesSchema", () => {
    it("should validate correct preferences", () => {
      const validPrefs = {
        fontSize: 14,
        tabSize: 2,
        wordWrap: true,
        minimap: false,
        theme: "vs-dark",
      };

      const result = EditorPreferencesSchema.safeParse(validPrefs);
      expect(result.success).toBe(true);
    });

    it("should accept all valid theme options", () => {
      const themes = ["vs-dark", "monokai", "github-dark"];

      for (const theme of themes) {
        const result = EditorPreferencesSchema.safeParse({
          fontSize: 14,
          tabSize: 2,
          wordWrap: true,
          minimap: false,
          theme,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept valid font sizes from 8 to 32", () => {
      const sizes = [8, 12, 16, 20, 28, 32];

      for (const fontSize of sizes) {
        const result = EditorPreferencesSchema.safeParse({
          fontSize,
          tabSize: 2,
          wordWrap: true,
          minimap: false,
          theme: "vs-dark",
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject font size below 8", () => {
      const result = EditorPreferencesSchema.safeParse({
        fontSize: 7,
        tabSize: 2,
        wordWrap: true,
        minimap: false,
        theme: "vs-dark",
      });
      expect(result.success).toBe(false);
    });

    it("should reject font size above 32", () => {
      const result = EditorPreferencesSchema.safeParse({
        fontSize: 33,
        tabSize: 2,
        wordWrap: true,
        minimap: false,
        theme: "vs-dark",
      });
      expect(result.success).toBe(false);
    });

    it("should accept valid tab sizes from 1 to 8", () => {
      const sizes = [1, 2, 4, 8];

      for (const tabSize of sizes) {
        const result = EditorPreferencesSchema.safeParse({
          fontSize: 14,
          tabSize,
          wordWrap: true,
          minimap: false,
          theme: "vs-dark",
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject tab size below 1", () => {
      const result = EditorPreferencesSchema.safeParse({
        fontSize: 14,
        tabSize: 0,
        wordWrap: true,
        minimap: false,
        theme: "vs-dark",
      });
      expect(result.success).toBe(false);
    });

    it("should reject tab size above 8", () => {
      const result = EditorPreferencesSchema.safeParse({
        fontSize: 14,
        tabSize: 9,
        wordWrap: true,
        minimap: false,
        theme: "vs-dark",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid theme", () => {
      const result = EditorPreferencesSchema.safeParse({
        fontSize: 14,
        tabSize: 2,
        wordWrap: true,
        minimap: false,
        theme: "invalid-theme",
      });
      expect(result.success).toBe(false);
    });

    it("should require all properties", () => {
      const incomplete = {
        fontSize: 14,
        tabSize: 2,
        wordWrap: true,
      };

      const result = EditorPreferencesSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it("should accept boolean values for wordWrap and minimap", () => {
      const result1 = EditorPreferencesSchema.safeParse({
        fontSize: 14,
        tabSize: 2,
        wordWrap: false,
        minimap: true,
        theme: "vs-dark",
      });
      expect(result1.success).toBe(true);

      const result2 = EditorPreferencesSchema.safeParse({
        fontSize: 14,
        tabSize: 2,
        wordWrap: true,
        minimap: false,
        theme: "vs-dark",
      });
      expect(result2.success).toBe(true);
    });

    it("should reject non-integer font sizes", () => {
      const result = EditorPreferencesSchema.safeParse({
        fontSize: 14.5,
        tabSize: 2,
        wordWrap: true,
        minimap: false,
        theme: "vs-dark",
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer tab sizes", () => {
      const result = EditorPreferencesSchema.safeParse({
        fontSize: 14,
        tabSize: 2.5,
        wordWrap: true,
        minimap: false,
        theme: "vs-dark",
      });
      expect(result.success).toBe(false);
    });
  });
});
