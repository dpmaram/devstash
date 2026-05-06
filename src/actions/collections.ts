"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getDashboardUserForSession } from "@/lib/db/dashboard-user";
import {
  createCollection as createCollectionRecord,
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
