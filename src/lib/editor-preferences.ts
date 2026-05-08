import { z } from "zod";

export const EditorPreferencesSchema = z.object({
  fontSize: z.number().int().min(8).max(32),
  tabSize: z.number().int().min(1).max(8),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(["vs-dark", "monokai", "github-dark"]),
});

export type EditorPreferences = z.infer<typeof EditorPreferencesSchema>;

export function getDefaultEditorPreferences(): EditorPreferences {
  return {
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    minimap: false,
    theme: "vs-dark",
  };
}
