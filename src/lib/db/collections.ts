import { prisma } from "@/lib/prisma";

import {
  buildDashboardStats,
  toDashboardCollection,
  type DashboardCollection,
  type DashboardStat,
} from "./collection-shaping";

export type { DashboardCollection, DashboardStat } from "./collection-shaping";

type DashboardCollectionData = {
  collections: DashboardCollection[];
  stats: DashboardStat[];
};

type DashboardCollectionsOptions = {
  limit?: number;
  userEmail?: string;
};

const defaultDashboardUserEmail = "demo@devstash.io";

const itemTypeSelect = {
  id: true,
  name: true,
  slug: true,
  icon: true,
  color: true,
} as const;

function getDashboardUserEmail(userEmail?: string) {
  return userEmail ?? process.env.DEVSTASH_DASHBOARD_USER_EMAIL ?? defaultDashboardUserEmail;
}

async function getDashboardUser(userEmail?: string) {
  const email = getDashboardUserEmail(userEmail);
  const userByEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (userByEmail) {
    return userByEmail;
  }

  return prisma.user.findFirst({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
}

export async function getDashboardCollections(
  options: DashboardCollectionsOptions = {},
) {
  const user = await getDashboardUser(options.userEmail);

  if (!user) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    take: options.limit ?? 6,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isFavorite: true,
      updatedAt: true,
      defaultType: {
        select: itemTypeSelect,
      },
      items: {
        orderBy: { addedAt: "asc" },
        select: {
          item: {
            select: {
              id: true,
              itemType: {
                select: itemTypeSelect,
              },
            },
          },
        },
      },
    },
  });

  return collections.map((collection) => toDashboardCollection(collection));
}

export async function getDashboardCollectionStats(
  options: Pick<DashboardCollectionsOptions, "userEmail"> = {},
) {
  const user = await getDashboardUser(options.userEmail);

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
  const [collections, stats] = await Promise.all([
    getDashboardCollections(options),
    getDashboardCollectionStats(options),
  ]);

  return { collections, stats };
}
