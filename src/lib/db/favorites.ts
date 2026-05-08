import { prisma } from "@/lib/prisma";

import { resolveDashboardUser, type DashboardUser } from "./dashboard-user";
import { toDashboardItem, type DashboardItem } from "./item-shaping";
import {
  toDashboardCollection,
  type DashboardCollection,
  type CollectionRecord,
  type CollectionTypeSummary,
  type CollectionItemType,
} from "./collection-shaping";
import {
  dashboardItemListSelect,
  dashboardCollectionSelect,
  dashboardCollectionTypeSummarySelect,
} from "./dashboard-query-shapes";

type FavoritesDataOptions = {
  user?: DashboardUser | null;
  userEmail?: string;
};

type FavoritesData = {
  items: DashboardItem[];
  collections: DashboardCollection[];
  itemsCount: number;
  collectionsCount: number;
};

type DashboardCollectionQueryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  defaultType: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
  } | null;
  _count: {
    items: number;
  };
};

type CollectionTypeSummaryRecord = {
  collectionId: string;
  item: {
    itemType: {
      id: string;
      name: string;
      slug: string;
      icon: string;
      color: string;
    };
  };
};

function buildCollectionTypeSummaries(records: CollectionTypeSummaryRecord[]) {
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
    defaultType: collection.defaultType as CollectionItemType | null,
    itemCount: collection._count.items,
    typeSummaries: typeSummariesByCollectionId.get(collection.id) ?? [],
  };
}

export async function getFavoritesData(
  options?: FavoritesDataOptions,
): Promise<FavoritesData> {
  const user = await resolveDashboardUser(options);

  if (!user) {
    return {
      items: [],
      collections: [],
      itemsCount: 0,
      collectionsCount: 0,
    };
  }

  // Get favorited items
  const favoriteItems = await prisma.item.findMany({
    where: {
      userId: user.id,
      isFavorite: true,
    },
    select: dashboardItemListSelect,
    orderBy: { updatedAt: "desc" },
  });

  // Get favorited collections
  const favoriteCollectionQueries = await prisma.collection.findMany({
    where: {
      userId: user.id,
      isFavorite: true,
    },
    select: dashboardCollectionSelect,
    orderBy: { updatedAt: "desc" },
  });

  // Get collection type summaries
  const typeSummaryRecords = await prisma.itemCollection.findMany({
    where: {
      collectionId: {
        in: favoriteCollectionQueries.map((c) => c.id),
      },
    },
    orderBy: [{ collectionId: "asc" }, { addedAt: "asc" }],
    select: dashboardCollectionTypeSummarySelect,
  });

  const typeSummariesByCollectionId = buildCollectionTypeSummaries(
    typeSummaryRecords as CollectionTypeSummaryRecord[],
  );

  // Shape items
  const items = favoriteItems.map((item) => toDashboardItem(item));

  // Shape collections
  const collections = (favoriteCollectionQueries as DashboardCollectionQueryRecord[]).map(
    (collection) =>
      toDashboardCollection(
        toCollectionRecord(collection, typeSummariesByCollectionId),
      ),
  );

  return {
    items,
    collections,
    itemsCount: items.length,
    collectionsCount: collections.length,
  };
}
