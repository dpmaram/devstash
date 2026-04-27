import { prisma } from "@/lib/prisma";

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
  user?: DashboardUser | null;
  userEmail?: string;
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

export async function getDashboardCollections(
  options: DashboardCollectionsOptions = {},
) {
  const user = await resolveDashboardUser(options);

  if (!user) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    take: options.limit ?? 6,
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
