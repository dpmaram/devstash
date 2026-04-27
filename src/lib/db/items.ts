import { prisma } from "@/lib/prisma";

import { dashboardItemListSelect, dashboardItemTypeSelect } from "./dashboard-query-shapes";
import { resolveDashboardUser, type DashboardUser } from "./dashboard-user";
import {
  sortDashboardItemTypes,
  toDashboardItem,
  toDashboardItemType,
  type DashboardItem,
  type DashboardItemType,
} from "./item-shaping";

export type { DashboardItem, DashboardItemType } from "./item-shaping";

type DashboardItemsOptions = {
  limit?: number;
  pinnedLimit?: number;
  recentLimit?: number;
  user?: DashboardUser | null;
  userEmail?: string;
};

type DashboardItemData = {
  pinnedItems: DashboardItem[];
  recentItems: DashboardItem[];
};

export async function getDashboardPinnedItems(
  options: DashboardItemsOptions = {},
) {
  const user = await resolveDashboardUser(options);

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
    select: dashboardItemListSelect,
  });

  return items.map((item) => toDashboardItem(item));
}

export async function getDashboardRecentItems(
  options: DashboardItemsOptions = {},
) {
  const user = await resolveDashboardUser(options);

  if (!user) {
    return [];
  }

  const items = await prisma.item.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: options.limit ?? 10,
    select: dashboardItemListSelect,
  });

  return items.map((item) => toDashboardItem(item));
}

export async function getDashboardItemTypes(
  options: Pick<DashboardItemsOptions, "user" | "userEmail"> = {},
): Promise<DashboardItemType[]> {
  const user = await resolveDashboardUser(options);
  const [itemTypes, itemCounts] = await Promise.all([
    prisma.itemType.findMany({
      where: { isSystem: true },
      orderBy: { createdAt: "asc" },
      select: dashboardItemTypeSelect,
    }),
    user
      ? prisma.item.groupBy({
          by: ["itemTypeId"],
          where: { userId: user.id },
          _count: {
            _all: true,
          },
        })
      : Promise.resolve([]),
  ]);
  const itemCountByTypeId = new Map(
    itemCounts.map((itemCount) => [itemCount.itemTypeId, itemCount._count._all]),
  );

  return sortDashboardItemTypes(itemTypes).map((itemType) =>
    toDashboardItemType({
      ...itemType,
      itemCount: itemCountByTypeId.get(itemType.id) ?? 0,
    }),
  );
}

export async function getDashboardItemData(
  options: DashboardItemsOptions = {},
): Promise<DashboardItemData> {
  const user = await resolveDashboardUser(options);
  const [pinnedItems, recentItems] = await Promise.all([
    getDashboardPinnedItems({
      limit: options.pinnedLimit ?? options.limit,
      user,
    }),
    getDashboardRecentItems({
      limit: options.recentLimit ?? options.limit,
      user,
    }),
  ]);

  return {
    pinnedItems,
    recentItems,
  };
}
