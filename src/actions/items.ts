"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import {
  updateItem as updateItemRecord,
  type ItemDetail,
  type UpdateItemInput,
} from "@/lib/db/items";

const nullableTrimmedString = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value ?? null;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
  },
  z.string().nullable(),
);

const nullableUrlString = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value ?? null;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
  },
  z.string().url("URL must be valid.").nullable(),
);

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: nullableTrimmedString,
  content: nullableTrimmedString,
  url: nullableUrlString,
  language: nullableTrimmedString,
  tags: z.array(z.string().trim().min(1, "Tags cannot be empty.")).default([]),
});

type UpdateItemActionDeps = {
  auth: () => Promise<{
    user?: {
      id?: string | null;
    };
  } | null>;
  getDashboardUserForSession: typeof getDashboardUserForSession;
  updateItem: (input: UpdateItemInput) => Promise<ItemDetail | null>;
};

type UpdateItemActionResult =
  | {
      success: true;
      data: ItemDetail;
    }
  | {
      success: false;
      error: string;
    };

const defaultUpdateItemActionDeps: UpdateItemActionDeps = {
  auth,
  getDashboardUserForSession,
  updateItem: updateItemRecord,
};

function getValidationError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid item data.";
}

export async function handleUpdateItem(
  itemId: unknown,
  data: unknown,
  deps: UpdateItemActionDeps = defaultUpdateItemActionDeps,
): Promise<UpdateItemActionResult> {
  const normalizedItemId = typeof itemId === "string" ? itemId.trim() : "";

  if (!normalizedItemId) {
    return {
      success: false,
      error: "Item id is required.",
    };
  }

  const parsedData = updateItemSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      success: false,
      error: getValidationError(parsedData.error),
    };
  }

  const session = await deps.auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in.",
    };
  }

  const dashboardUser = await deps.getDashboardUserForSession(session.user);

  if (!dashboardUser) {
    return {
      success: false,
      error: "Item not found.",
    };
  }

  const item = await deps.updateItem({
    itemId: normalizedItemId,
    userId: dashboardUser.id,
    data: parsedData.data,
  });

  if (!item) {
    return {
      success: false,
      error: "Item not found.",
    };
  }

  return {
    success: true,
    data: item,
  };
}

export async function updateItem(itemId: string, data: unknown) {
  return handleUpdateItem(itemId, data);
}
