"use client";

import { useEffect, useState } from "react";
import { Check, Code2, Loader2 } from "lucide-react";

import {
  type EditorPreferences,
  getDefaultEditorPreferences,
} from "@/lib/editor-preferences";
import {
  getEditorPreferences,
  updateEditorPreferences,
} from "@/actions/editor-preferences";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FONT_SIZE_OPTIONS = Array.from({ length: 9 }, (_, i) => 12 + i * 2); // 12-28
const TAB_SIZE_OPTIONS = [2, 4, 8];
const THEME_OPTIONS = ["vs-dark", "monokai", "github-dark"] as const;

type Toast = {
  type: "success" | "error";
  message: string;
};

export function EditorPreferencesPanel() {
  const [preferences, setPreferences] = useState<EditorPreferences>(
    getDefaultEditorPreferences(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Load preferences on mount
  useEffect(() => {
    async function load() {
      const saved = await getEditorPreferences();
      if (saved) {
        setPreferences(saved);
      }
      setIsLoading(false);
    }

    void load();
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleChange(key: keyof EditorPreferences, value: unknown) {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    setIsSaving(true);

    const response = await updateEditorPreferences(newPrefs);

    if (response.success) {
      setToast({
        type: "success",
        message: "Editor preferences saved",
      });
    } else {
      setToast({
        type: "error",
        message: response.error || "Failed to save preferences",
      });
      // Revert on error
      const saved = await getEditorPreferences();
      if (saved) {
        setPreferences(saved);
      }
    }

    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <article className="rounded-lg border border-devstash-line bg-white/[0.035] p-5">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading preferences...</p>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-devstash-line bg-white/[0.035] p-5">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-blue-400/10 text-blue-200">
          <Code2 aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-white">Editor Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Customize your code editor experience
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Font Size */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-white">Font Size</label>
            <p className="text-xs text-muted-foreground">
              {preferences.fontSize}px
            </p>
          </div>
          <select
            className="rounded-lg border border-devstash-line bg-white/[0.04] px-3 py-2 text-sm text-white transition hover:bg-white/[0.06]"
            disabled={isSaving}
            onChange={(e) =>
              handleChange("fontSize", parseInt(e.currentTarget.value, 10))
            }
            value={preferences.fontSize}
          >
            {FONT_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        {/* Tab Size */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-white">Tab Size</label>
            <p className="text-xs text-muted-foreground">
              {preferences.tabSize} spaces
            </p>
          </div>
          <select
            className="rounded-lg border border-devstash-line bg-white/[0.04] px-3 py-2 text-sm text-white transition hover:bg-white/[0.06]"
            disabled={isSaving}
            onChange={(e) =>
              handleChange("tabSize", parseInt(e.currentTarget.value, 10))
            }
            value={preferences.tabSize}
          >
            {TAB_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} spaces
              </option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-white">Theme</label>
            <p className="text-xs text-muted-foreground capitalize">
              {preferences.theme.replace("-", " ")}
            </p>
          </div>
          <select
            className="rounded-lg border border-devstash-line bg-white/[0.04] px-3 py-2 text-sm text-white transition hover:bg-white/[0.06]"
            disabled={isSaving}
            onChange={(e) =>
              handleChange("theme", e.currentTarget.value as EditorPreferences["theme"])
            }
            value={preferences.theme}
          >
            {THEME_OPTIONS.map((theme) => (
              <option key={theme} value={theme}>
                {theme.replace("-", " ").replace("vs dark", "VS Dark")}
              </option>
            ))}
          </select>
        </div>

        {/* Word Wrap Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-white">Word Wrap</label>
            <p className="text-xs text-muted-foreground">
              {preferences.wordWrap ? "Enabled" : "Disabled"}
            </p>
          </div>
          <Button
            className={cn(
              "size-9 rounded-lg border transition",
              preferences.wordWrap
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                : "border-devstash-line bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06]",
            )}
            disabled={isSaving}
            onClick={() => handleChange("wordWrap", !preferences.wordWrap)}
            type="button"
            variant="outline"
          >
            {preferences.wordWrap ? (
              <Check aria-hidden="true" className="size-4" />
            ) : null}
          </Button>
        </div>

        {/* Minimap Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-white">Minimap</label>
            <p className="text-xs text-muted-foreground">
              {preferences.minimap ? "Visible" : "Hidden"}
            </p>
          </div>
          <Button
            className={cn(
              "size-9 rounded-lg border transition",
              preferences.minimap
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                : "border-devstash-line bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06]",
            )}
            disabled={isSaving}
            onClick={() => handleChange("minimap", !preferences.minimap)}
            type="button"
            variant="outline"
          >
            {preferences.minimap ? (
              <Check aria-hidden="true" className="size-4" />
            ) : null}
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div
          className={cn(
            "mt-6 rounded-lg border px-4 py-3 text-sm",
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200",
          )}
        >
          {toast.message}
        </div>
      ) : null}
    </article>
  );
}
