"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  updateItem as updateItemRecord,
  type CreateItemInput,
  type DeletedItem,
  type ItemDetail,
  type DeleteItemInput,
  type UpdateItemInput,
} from "@/lib/db/items";
import { deleteStoredFile } from "@/lib/storage/r2";

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

const nullablePositiveInteger = z.preprocess(
  (value) => {
    if (value === "" || value === undefined || value === null) {
      return null;
    }

    return value;
  },
  z.number().int().positive().nullable(),
);

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: nullableTrimmedString,
  content: nullableTrimmedString,
  url: nullableUrlString,
  language: nullableTrimmedString,
  tags: z.array(z.string().trim().min(1, "Tags cannot be empty.")).default([]),
});

const createItemSchema = z
  .object({
    typeSlug: z.enum(["snippet", "prompt", "command", "note", "link", "file", "image"]),
    title: z.string().trim().min(1, "Title is required."),
    description: nullableTrimmedString,
    content: nullableTrimmedString,
    url: nullableUrlString,
    fileUrl: nullableTrimmedString,
    fileName: nullableTrimmedString,
    fileSize: nullablePositiveInteger,
    language: nullableTrimmedString,
    tags: z.array(z.string().trim().min(1, "Tags cannot be empty.")).default([]),
  })
  .superRefine((data, context) => {
    if (data.typeSlug === "link" && !data.url) {
      context.addIssue({
        code: "custom",
        message: "URL is required.",
        path: ["url"],
      });
    }

    if (
      (data.typeSlug === "file" || data.typeSlug === "image") &&
      (!data.fileUrl || !data.fileName || !data.fileSize)
    ) {
      context.addIssue({
        code: "custom",
        message: "Upload is required.",
        path: ["fileUrl"],
      });
    }
  })
  .transform((data) => ({
    typeSlug: data.typeSlug,
    title: data.title,
    description: data.description,
    content:
      data.typeSlug === "link" ||
      data.typeSlug === "file" ||
      data.typeSlug === "image"
        ? null
        : data.content,
    url: data.typeSlug === "link" ? data.url : null,
    ...(data.typeSlug === "file" || data.typeSlug === "image"
      ? {
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
        }
      : {}),
    language:
      data.typeSlug === "snippet" || data.typeSlug === "command"
        ? data.language
        : null,
    tags: data.tags,
  }));

type CreateItemActionDeps = {
  auth: () => Promise<{
    user?: {
      id?: string | null;
    };
  } | null>;
  createItem: (input: CreateItemInput) => Promise<ItemDetail | null>;
  getDashboardUserForSession: typeof getDashboardUserForSession;
};

type UpdateItemActionDeps = {
  auth: () => Promise<{
    user?: {
      id?: string | null;
    };
  } | null>;
  getDashboardUserForSession: typeof getDashboardUserForSession;
  updateItem: (input: UpdateItemInput) => Promise<ItemDetail | null>;
};

type DeleteItemActionDeps = {
  auth: () => Promise<{
    user?: {
      id?: string | null;
    };
  } | null>;
  deleteItem: (input: DeleteItemInput) => Promise<DeletedItem | false | null>;
  deleteStoredFile?: (fileUrl: string) => Promise<void>;
  getDashboardUserForSession: typeof getDashboardUserForSession;
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

type CreateItemActionResult =
  | {
      success: true;
      data: ItemDetail;
    }
  | {
      success: false;
      error: string;
    };

type DeleteItemActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

const defaultCreateItemActionDeps: CreateItemActionDeps = {
  auth,
  createItem: createItemRecord,
  getDashboardUserForSession,
};

const defaultUpdateItemActionDeps: UpdateItemActionDeps = {
  auth,
  getDashboardUserForSession,
  updateItem: updateItemRecord,
};

const defaultDeleteItemActionDeps: DeleteItemActionDeps = {
  auth,
  deleteItem: deleteItemRecord,
  deleteStoredFile,
  getDashboardUserForSession,
};

function getValidationError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid item data.";
}

export async function handleCreateItem(
  data: unknown,
  deps: CreateItemActionDeps = defaultCreateItemActionDeps,
): Promise<CreateItemActionResult> {
  const parsedData = createItemSchema.safeParse(data);

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
      error: "Unable to create item.",
    };
  }

  const item = await deps.createItem({
    userId: dashboardUser.id,
    data: parsedData.data,
  });

  if (!item) {
    return {
      success: false,
      error: "Unable to create item.",
    };
  }

  return {
    success: true,
    data: item,
  };
}

export async function createItem(data: unknown) {
  return handleCreateItem(data);
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

export async function handleDeleteItem(
  itemId: unknown,
  deps: DeleteItemActionDeps = defaultDeleteItemActionDeps,
): Promise<DeleteItemActionResult> {
  const normalizedItemId = typeof itemId === "string" ? itemId.trim() : "";

  if (!normalizedItemId) {
    return {
      success: false,
      error: "Item id is required.",
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

  const deletedItem = await deps.deleteItem({
    itemId: normalizedItemId,
    userId: dashboardUser.id,
  });

  if (!deletedItem) {
    return {
      success: false,
      error: "Item not found.",
    };
  }

  if (typeof deletedItem !== "boolean" && deletedItem.fileUrl && deps.deleteStoredFile) {
    try {
      await deps.deleteStoredFile(deletedItem.fileUrl);
    } catch (error) {
      console.warn("Unable to delete stored file for item.", error);
    }
  }

  return {
    success: true,
  };
}

export async function deleteItem(itemId: string) {
  return handleDeleteItem(itemId);
}
