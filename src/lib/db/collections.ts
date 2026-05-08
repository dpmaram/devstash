import { prisma } from "@/lib/prisma";
import {
  DASHBOARD_COLLECTIONS_LIMIT,
  getPaginationOffset,
} from "@/lib/pagination";

import {
  dashboardCollectionSelect,
  dashboardCollectionTypeSummarySelect,
} from "./dashboard-query-shapes";
import { resolveDashboardUser, type DashboardUser } from "./dashboard-user";
import {
  buildDashboardStats,
  toDashboardCollection,
  type DashboardCollection,
  type CollectionItemType,
  type CollectionRecord,
  type CollectionTypeSummary,
  type DashboardStat,
} from "./collection-shaping";

export type { DashboardCollection, DashboardStat } from "./collection-shaping";

type DashboardCollectionData = {
  collections: DashboardCollection[];
  stats: DashboardStat[];
};

type DashboardCollectionsOptions = {
  limit?: number;
  page?: number;
  user?: DashboardUser | null;
  userEmail?: string;
};

type DashboardCollectionBySlugOptions = Pick<
  DashboardCollectionsOptions,
  "user" | "userEmail"
> & {
  slug: string;
};

export type CreateCollectionData = {
  name: string;
  description?: string | null;
};

export type CreateCollectionInput = {
  userId: string;
  data: CreateCollectionData;
};

type DashboardCollectionQueryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  defaultType: CollectionItemType | null;
  _count: {
    items: number;
  };
};

type CollectionTypeSummaryRecord = {
  collectionId: string;
  item: {
    itemType: CollectionItemType;
  };
};

type CreateCollectionDeps = {
  findCollectionBySlug: (input: {
    userId: string;
    slug: string;
  }) => Promise<{ id: string } | null>;
  createCollectionRecord: (input: {
    userId: string;
    data: {
      name: string;
      slug: string;
      description: string | null;
    };
  }) => Promise<{ id: string }>;
  findCollectionById: (input: {
    userId: string;
    collectionId: string;
  }) => Promise<DashboardCollectionQueryRecord | null>;
};

export function slugifyCollectionName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "collection"
  );
}

function buildCollectionTypeSummaries(
  records: CollectionTypeSummaryRecord[],
) {
  const summariesByCollectionId = new Map<
    string,
    Map<string, CollectionTypeSummary>
  >();

  for (const record of records) {
    let summariesBySlug = summariesByCollectionId.get(record.collectionId);

    if (!summariesBySlug) {
      summariesBySlug = new Map<string, CollectionTypeSummary>();
      summariesByCollectionId.set(record.collectionId, summariesBySlug);
    }

    const itemType = record.item.itemType;
    const existingSummary = summariesBySlug.get(itemType.slug);

    summariesBySlug.set(itemType.slug, {
      itemType,
      itemCount: (existingSummary?.itemCount ?? 0) + 1,
    });
  }

  return new Map(
    [...summariesByCollectionId.entries()].map(([collectionId, summariesBySlug]) => [
      collectionId,
      [...summariesBySlug.values()],
    ]),
  );
}

async function getCollectionTypeSummaries(collectionIds: string[]) {
  if (collectionIds.length === 0) {
    return new Map<string, CollectionTypeSummary[]>();
  }

  const typeSummaryRecords = await prisma.itemCollection.findMany({
    where: {
      collectionId: {
        in: collectionIds,
      },
    },
    orderBy: [{ collectionId: "asc" }, { addedAt: "asc" }],
    select: dashboardCollectionTypeSummarySelect,
  });

  return buildCollectionTypeSummaries(typeSummaryRecords);
}

function toCollectionRecord(
  collection: DashboardCollectionQueryRecord,
  typeSummariesByCollectionId: Map<string, CollectionTypeSummary[]>,
): CollectionRecord {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    isFavorite: collection.isFavorite,
    updatedAt: collection.updatedAt,
    defaultType: collection.defaultType,
    itemCount: collection._count.items,
    typeSummaries: typeSummariesByCollectionId.get(collection.id) ?? [],
  };
}

function createCreateCollectionDeps(): CreateCollectionDeps {
  return {
    findCollectionBySlug: ({ userId, slug }) =>
      prisma.collection.findUnique({
        where: {
          userId_slug: {
            userId,
            slug,
          },
        },
        select: {
          id: true,
        },
      }),
    createCollectionRecord: ({ userId, data }) =>
      prisma.collection.create({
        data: {
          userId,
          name: data.name,
          slug: data.slug,
          description: data.description,
        },
        select: {
          id: true,
        },
      }),
    findCollectionById: ({ userId, collectionId }) =>
      prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId,
        },
        select: dashboardCollectionSelect,
      }),
  };
}

export async function createCollection(
  input: CreateCollectionInput,
  deps: CreateCollectionDeps = createCreateCollectionDeps(),
) {
  const name = input.data.name.trim();

  if (!name) {
    return null;
  }

  const description = input.data.description?.trim() || null;
  const slug = slugifyCollectionName(name);
  const existingCollection = await deps.findCollectionBySlug({
    userId: input.userId,
    slug,
  });

  if (existingCollection) {
    return null;
  }

  const collection = await deps.createCollectionRecord({
    userId: input.userId,
    data: {
      name,
      slug,
      description,
    },
  });
  const createdCollection = await deps.findCollectionById({
    userId: input.userId,
    collectionId: collection.id,
  });

  if (!createdCollection) {
    return null;
  }

  return toDashboardCollection(
    toCollectionRecord(createdCollection, new Map()),
  );
}

export async function getDashboardCollections(
  options: DashboardCollectionsOptions = {},
) {
  const user = await resolveDashboardUser(options);

  if (!user) {
    return [];
  }

  const page = Math.max(options.page ?? 1, 1);
  const take = options.limit ?? DASHBOARD_COLLECTIONS_LIMIT;

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    skip: getPaginationOffset(page, take),
    take,
    select: dashboardCollectionSelect,
  });
  const typeSummariesByCollectionId = await getCollectionTypeSummaries(
    collections.map((collection) => collection.id),
  );

  return collections.map((collection) =>
    toDashboardCollection(
      toCollectionRecord(collection, typeSummariesByCollectionId),
    ),
  );
}

export async function getDashboardCollectionCount(
  options: Pick<DashboardCollectionsOptions, "user" | "userEmail"> = {},
) {
  const user = await resolveDashboardUser(options);

  if (!user) {
    return 0;
  }

  return prisma.collection.count({
    where: { userId: user.id },
  });
}

export async function getDashboardCollectionBySlug(
  options: DashboardCollectionBySlugOptions,
) {
  const user = await resolveDashboardUser(options);

  if (!user) {
    return null;
  }

  const slug = options.slug.trim().toLowerCase();
  const collection = await prisma.collection.findFirst({
    where: {
      userId: user.id,
      slug,
    },
    select: dashboardCollectionSelect,
  });

  if (!collection) {
    return null;
  }

  const typeSummariesByCollectionId = await getCollectionTypeSummaries([
    collection.id,
  ]);

  return toDashboardCollection(
    toCollectionRecord(collection, typeSummariesByCollectionId),
  );
}

export async function getDashboardCollectionStats(
  options: Pick<DashboardCollectionsOptions, "user" | "userEmail"> = {},
) {
  const user = await resolveDashboardUser(options);

  if (!user) {
    return buildDashboardStats({
      itemCount: 0,
      collectionCount: 0,
      favoriteCollectionCount: 0,
      pinnedItemCount: 0,
      promptItemCount: 0,
    });
  }

  const [
    itemCount,
    collectionCount,
    favoriteCollectionCount,
    pinnedItemCount,
    promptItemCount,
  ] = await Promise.all([
    prisma.item.count({ where: { userId: user.id } }),
    prisma.collection.count({ where: { userId: user.id } }),
    prisma.collection.count({
      where: {
        userId: user.id,
        isFavorite: true,
      },
    }),
    prisma.item.count({
      where: {
        userId: user.id,
        isPinned: true,
      },
    }),
    prisma.item.count({
      where: {
        userId: user.id,
        itemType: {
          slug: "prompt",
        },
      },
    }),
  ]);

  return buildDashboardStats({
    itemCount,
    collectionCount,
    favoriteCollectionCount,
    pinnedItemCount,
    promptItemCount,
  });
}

export async function getDashboardCollectionData(
  options: DashboardCollectionsOptions = {},
): Promise<DashboardCollectionData> {
  const user = await resolveDashboardUser(options);
  const [collections, stats] = await Promise.all([
    getDashboardCollections({ ...options, user }),
    getDashboardCollectionStats({ ...options, user }),
  ]);

  return { collections, stats };
}

export type UpdateCollectionData = {
  name?: string;
  description?: string | null;
};

export async function updateCollection({
  userId,
  collectionId,
  data,
}: {
  userId: string;
  collectionId: string;
  data: UpdateCollectionData;
}) {
  // Verify ownership
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { userId: true, slug: true },
  });

  if (!collection || collection.userId !== userId) {
    return null;
  }

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    if (trimmedName) {
      updateData.name = trimmedName;
    }
  }

  if (data.description !== undefined) {
    updateData.description = data.description?.trim() || null;
  }

  if (Object.keys(updateData).length === 0) {
    // No valid updates
    return getDashboardCollectionBySlug({
      slug: collection.slug,
      user: { id: userId },
    });
  }

  await prisma.collection.update({
    where: { id: collectionId },
    data: updateData,
  });

  return getDashboardCollectionBySlug({
    slug: collection.slug,
    user: { id: userId },
  });
}

export async function deleteCollection({
  userId,
  collectionId,
}: {
  userId: string;
  collectionId: string;
}): Promise<boolean> {
  // Verify ownership
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { userId: true },
  });

  if (!collection || collection.userId !== userId) {
    return false;
  }

  // Delete collection (this will cascade to ItemCollection records due to the schema)
  await prisma.collection.delete({
    where: { id: collectionId },
  });

  return true;
}
