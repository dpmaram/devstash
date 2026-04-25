import { prisma } from "@/lib/prisma";

import { toDashboardItem, type DashboardItem } from "./item-shaping";

export type { DashboardItem } from "./item-shaping";

type DashboardItemsOptions = {
  limit?: number;
  pinnedLimit?: number;
  recentLimit?: number;
  userEmail?: string;
};

type DashboardItemData = {
  pinnedItems: DashboardItem[];
  recentItems: DashboardItem[];
};

const defaultDashboardUserEmail = "demo@devstash.io";

const itemTypeSelect = {
  id: true,
  name: true,
  slug: true,
  icon: true,
  color: true,
} as const;

const itemSelect = {
  id: true,
  title: true,
  description: true,
  content: true,
  url: true,
  fileName: true,
  fileUrl: true,
  language: true,
  isPinned: true,
  isFavorite: true,
  updatedAt: true,
  itemType: {
    select: itemTypeSelect,
  },
  collections: {
    orderBy: { addedAt: "asc" },
    select: {
      collection: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  },
  tags: {
    select: {
      tag: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  },
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

export async function getDashboardPinnedItems(
  options: DashboardItemsOptions = {},
) {
  const user = await getDashboardUser(options.userEmail);

  if (!user) {
    return [];
  }

  const items = await prisma.item.findMany({
    where: {
      userId: user.id,
      isPinned: true,
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: options.limit ?? 3,
    select: itemSelect,
  });

  return items.map((item) => toDashboardItem(item));
}

export async function getDashboardRecentItems(
  options: DashboardItemsOptions = {},
) {
  const user = await getDashboardUser(options.userEmail);

  if (!user) {
    return [];
  }

  const items = await prisma.item.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: options.limit ?? 10,
    select: itemSelect,
  });

  return items.map((item) => toDashboardItem(item));
}

export async function getDashboardItemData(
  options: DashboardItemsOptions = {},
): Promise<DashboardItemData> {
  const [pinnedItems, recentItems] = await Promise.all([
    getDashboardPinnedItems({
      limit: options.pinnedLimit ?? options.limit,
      userEmail: options.userEmail,
    }),
    getDashboardRecentItems({
      limit: options.recentLimit ?? options.limit,
      userEmail: options.userEmail,
    }),
  ]);

  return {
    pinnedItems,
    recentItems,
  };
}
