"use server";

import { auth } from "@/auth";
import {
  EditorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

type UpdateEditorPreferencesResponse = {
  success: boolean;
  error?: string;
  data?: EditorPreferences;
};

export async function updateEditorPreferences(
  preferences: unknown,
): Promise<UpdateEditorPreferencesResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const validation = EditorPreferencesSchema.safeParse(preferences);

    if (!validation.success) {
      return {
        success: false,
        error: "Invalid editor preferences",
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        editorPreferences: validation.data,
      },
      select: {
        editorPreferences: true,
      },
    });

    return {
      success: true,
      data: (updatedUser.editorPreferences as EditorPreferences) || undefined,
    };
  } catch (error) {
    console.error("[updateEditorPreferences] Error:", error);
    return {
      success: false,
      error: "Failed to update editor preferences",
    };
  }
}

export async function getEditorPreferences(): Promise<EditorPreferences | null> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        editorPreferences: true,
      },
    });

    return (user?.editorPreferences as EditorPreferences) || null;
  } catch (error) {
    console.error("[getEditorPreferences] Error:", error);
    return null;
  }
}

