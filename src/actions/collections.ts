"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import {
  createCollection as createCollectionRecord,
  toggleCollectionFavorite,
  type CreateCollectionInput,
  type DashboardCollection,
} from "@/lib/db/collections";

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

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  description: nullableTrimmedString.optional(),
});

type CreateCollectionActionDeps = {
  auth: () => Promise<{
    user?: {
      id?: string | null;
    };
  } | null>;
  createCollection: (input: CreateCollectionInput) => Promise<DashboardCollection | null>;
  getDashboardUserForSession: typeof getDashboardUserForSession;
};

type CreateCollectionActionResult =
  | {
      success: true;
      data: DashboardCollection;
    }
  | {
      success: false;
      error: string;
    };

const defaultCreateCollectionActionDeps: CreateCollectionActionDeps = {
  auth,
  createCollection: createCollectionRecord,
  getDashboardUserForSession,
};

function getValidationError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid collection data.";
}

export async function handleCreateCollection(
  data: unknown,
  deps: CreateCollectionActionDeps = defaultCreateCollectionActionDeps,
): Promise<CreateCollectionActionResult> {
  const parsedData = createCollectionSchema.safeParse(data);

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
      error: "Unable to create collection.",
    };
  }

  const collection = await deps.createCollection({
    userId: dashboardUser.id,
    data: {
      name: parsedData.data.name,
      description: parsedData.data.description ?? null,
    },
  });

  if (!collection) {
    return {
      success: false,
      error: "Unable to create collection.",
    };
  }

  return {
    success: true,
    data: collection,
  };
}

export async function createCollection(data: unknown) {
  return handleCreateCollection(data);
}

const updateCollectionSchema = z.object({
  collectionId: z.string().min(1, "Collection ID is required."),
  name: z.string().trim().min(1, "Name is required.").optional(),
  description: nullableTrimmedString.optional(),
});

type UpdateCollectionResult =
  | {
      success: true;
      data: DashboardCollection;
    }
  | {
      success: false;
      error: string;
    };

export async function updateCollection(data: unknown): Promise<UpdateCollectionResult> {
  const parsed = updateCollectionSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid collection data.",
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in.",
    };
  }

  const dashboardUser = await getDashboardUserForSession(session.user);

  if (!dashboardUser) {
    return {
      success: false,
      error: "Unable to update collection.",
    };
  }

  const { updateCollection: updateCollectionDb } = await import("@/lib/db/collections");
  const collection = await updateCollectionDb({
    userId: dashboardUser.id,
    collectionId: parsed.data.collectionId,
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
    },
  });

  if (!collection) {
    return {
      success: false,
      error: "Unable to update collection.",
    };
  }

  return {
    success: true,
    data: collection,
  };
}

type DeleteCollectionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function deleteCollection(
  collectionId: unknown,
): Promise<DeleteCollectionResult> {
  if (typeof collectionId !== "string" || !collectionId) {
    return {
      success: false,
      error: "Invalid collection ID.",
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in.",
    };
  }

  const dashboardUser = await getDashboardUserForSession(session.user);

  if (!dashboardUser) {
    return {
      success: false,
      error: "Unable to delete collection.",
    };
  }

  const { deleteCollection: deleteCollectionDb } = await import("@/lib/db/collections");
  const success = await deleteCollectionDb({
    userId: dashboardUser.id,
    collectionId,
  });

  if (!success) {
    return {
      success: false,
      error: "Unable to delete collection.",
    };
  }

  return {
    success: true,
  };
}

export async function toggleCollectionFavoriteAction(collectionId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in.",
    };
  }

  const normalizedCollectionId = typeof collectionId === "string" ? collectionId.trim() : "";

  if (!normalizedCollectionId) {
    return {
      success: false,
      error: "Collection id is required.",
    };
  }

  const dashboardUser = await getDashboardUserForSession(session.user);

  if (!dashboardUser) {
    return {
      success: false,
      error: "Collection not found.",
    };
  }

  const result = await toggleCollectionFavorite(normalizedCollectionId, dashboardUser.id);

  if (!result) {
    return {
      success: false,
      error: "Collection not found.",
    };
  }

  return {
    success: true,
  };
}
