"use client";

import { createContext, useContext, useEffect, useState } from "react";

import {
  type EditorPreferences,
  getDefaultEditorPreferences,
} from "@/lib/editor-preferences";
import {
  getEditorPreferences,
  updateEditorPreferences,
} from "@/actions/editor-preferences";

type EditorPreferencesContextType = {
  preferences: EditorPreferences;
  updatePreferences: (prefs: Partial<EditorPreferences>) => Promise<void>;
  isLoading: boolean;
};

const EditorPreferencesContext = createContext<
  EditorPreferencesContextType | undefined
>(undefined);

export function EditorPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<EditorPreferences>(
    getDefaultEditorPreferences(),
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from server on mount
  useEffect(() => {
    async function loadPreferences() {
      const savedPrefs = await getEditorPreferences();
      if (savedPrefs) {
        setPreferences(savedPrefs);
      }
      setIsLoading(false);
    }

    void loadPreferences();
  }, []);

  async function handleUpdatePreferences(
    newPrefs: Partial<EditorPreferences>,
  ) {
    const merged = { ...preferences, ...newPrefs };
    setPreferences(merged);

    const response = await updateEditorPreferences(merged);
    if (!response.success) {
      // Revert on error
      setPreferences(preferences);
      console.error("Failed to save editor preferences:", response.error);
    }
  }

  return (
    <EditorPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences: handleUpdatePreferences,
        isLoading,
      }}
    >
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences() {
  const context = useContext(EditorPreferencesContext);
  if (!context) {
    throw new Error(
      "useEditorPreferences must be used within EditorPreferencesProvider",
    );
  }
  return context;
}
