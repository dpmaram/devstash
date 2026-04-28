import { prisma } from "@/lib/prisma";

import {
  dashboardItemListSelect,
  dashboardItemTypeSelect,
  itemDetailSelect,
} from "./dashboard-query-shapes";
import { resolveDashboardUser, type DashboardUser } from "./dashboard-user";
import {
  sortDashboardItemTypes,
  toDashboardItem,
  toItemDetail,
  toDashboardItemType,
  type DashboardItem,
  type DashboardItemType,
  type ItemDetail,
  type ItemDetailRecord,
} from "./item-shaping";

export type { DashboardItem, DashboardItemType, ItemDetail } from "./item-shaping";

type DashboardItemsOptions = {
  limit?: number;
  pinnedLimit?: number;
  recentLimit?: number;
  user?: DashboardUser | null;
  userEmail?: string;
};

type DashboardItemsByTypeOptions = Pick<
  DashboardItemsOptions,
  "limit" | "user" | "userEmail"
> & {
  typeSlug: string;
};

type DashboardItemData = {
  pinnedItems: DashboardItem[];
  recentItems: DashboardItem[];
};

type ItemDetailOptions = {
  itemId: string;
  userId: string;
};

export type CreateItemData = {
  content: string | null;
  description: string | null;
  language: string | null;
  tags: string[];
  title: string;
  typeSlug: string;
  url: string | null;
};

export type CreateItemInput = {
  data: CreateItemData;
  userId: string;
};

export type UpdateItemData = {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
};

export type UpdateItemInput = {
  data: UpdateItemData;
  itemId: string;
  userId: string;
};

export type DeleteItemInput = {
  itemId: string;
  userId: string;
};

type NormalizedItemTag = {
  name: string;
  slug: string;
};

type CreatedItemRecord = {
  id: string;
};

type ItemTypeIdRecord = {
  id: string;
};

type CreateItemDeps = {
  createItemRecord: (input: {
    data: Omit<CreateItemData, "tags" | "typeSlug"> & {
      contentType: "TEXT" | "URL";
      itemTypeId: string;
    };
    userId: string;
  }) => Promise<CreatedItemRecord>;
  createItemTags: (input: {
    itemId: string;
    tagIds: string[];
  }) => Promise<void>;
  findItemDetail: (input: {
    itemId: string;
    userId: string;
  }) => Promise<ItemDetailRecord | null>;
  findItemTypeBySlug: (slug: string) => Promise<ItemTypeIdRecord | null>;
  upsertTag: (input: NormalizedItemTag & { userId: string }) => Promise<{ id: string }>;
};

type UpdateItemDeps = {
  findOwnedItem: (input: {
    itemId: string;
    userId: string;
  }) => Promise<{ id: string } | null>;
  updateItemFields: (input: {
    data: Omit<UpdateItemData, "tags">;
    itemId: string;
  }) => Promise<void>;
  deleteItemTags: (itemId: string) => Promise<void>;
  upsertTag: (input: NormalizedItemTag & { userId: string }) => Promise<{ id: string }>;
  createItemTags: (input: {
    itemId: string;
    tagIds: string[];
  }) => Promise<void>;
  findItemDetail: (input: {
    itemId: string;
    userId: string;
  }) => Promise<ItemDetailRecord | null>;
};

type DeleteItemDeps = {
  deleteItemRecord: (itemId: string) => Promise<void>;
  findOwnedItem: (input: {
    itemId: string;
    userId: string;
  }) => Promise<{ id: string } | null>;
};

export function normalizeItemTypeRouteSlug(value: string) {
  const normalizedValue = decodeURIComponent(value).trim().toLowerCase();

  if (normalizedValue.endsWith("ies")) {
    return `${normalizedValue.slice(0, -3)}y`;
  }

  if (normalizedValue.endsWith("s")) {
    return normalizedValue.slice(0, -1);
  }

  return normalizedValue;
}

function slugifyTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeItemTags(tags: string[]) {
  const tagsBySlug = new Map<string, NormalizedItemTag>();

  for (const tag of tags) {
    const name = tag.trim();
    const slug = slugifyTag(name);

    if (!name || !slug || tagsBySlug.has(slug)) {
      continue;
    }

    tagsBySlug.set(slug, {
      name,
      slug,
    });
  }

  return Array.from(tagsBySlug.values());
}

function getCreateItemContentType(typeSlug: string): "TEXT" | "URL" {
  return typeSlug === "link" ? "URL" : "TEXT";
}

function getCreateItemFields(data: CreateItemData, itemTypeId: string) {
  const contentType = getCreateItemContentType(data.typeSlug);

  return {
    title: data.title,
    description: data.description,
    contentType,
    content: contentType === "TEXT" ? data.content : null,
    url: contentType === "URL" ? data.url : null,
    language:
      data.typeSlug === "snippet" || data.typeSlug === "command"
        ? data.language
        : null,
    itemTypeId,
  };
}

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

export async function getDashboardItemsByTypeSlug(
  options: DashboardItemsByTypeOptions,
) {
  const user = await resolveDashboardUser(options);

  if (!user) {
    return [];
  }

  const items = await prisma.item.findMany({
    where: {
      userId: user.id,
      itemType: {
        slug: normalizeItemTypeRouteSlug(options.typeSlug),
      },
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: options.limit ?? 50,
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

export async function getItemDetail({
  itemId,
  userId,
}: ItemDetailOptions): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      userId,
    },
    select: itemDetailSelect,
  });

  if (!item) {
    return null;
  }

  return toItemDetail(item);
}

async function findOwnedItem(input: { itemId: string; userId: string }) {
  return prisma.item.findFirst({
    where: {
      id: input.itemId,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });
}

async function updateItemFields(input: {
  data: Omit<UpdateItemData, "tags">;
  itemId: string;
}) {
  await prisma.item.update({
    where: {
      id: input.itemId,
    },
    data: input.data,
  });
}

async function deleteItemTags(itemId: string) {
  await prisma.itemTag.deleteMany({
    where: {
      itemId,
    },
  });
}

async function upsertTag(input: NormalizedItemTag & { userId: string }) {
  return prisma.tag.upsert({
    where: {
      userId_slug: {
        userId: input.userId,
        slug: input.slug,
      },
    },
    update: {
      name: input.name,
    },
    create: {
      userId: input.userId,
      name: input.name,
      slug: input.slug,
    },
    select: {
      id: true,
    },
  });
}

async function createItemTags(input: { itemId: string; tagIds: string[] }) {
  if (input.tagIds.length === 0) {
    return;
  }

  await prisma.itemTag.createMany({
    data: input.tagIds.map((tagId) => ({
      itemId: input.itemId,
      tagId,
    })),
    skipDuplicates: true,
  });
}

async function findItemDetail(input: { itemId: string; userId: string }) {
  return prisma.item.findFirst({
    where: {
      id: input.itemId,
      userId: input.userId,
    },
    select: itemDetailSelect,
  });
}

async function findItemTypeBySlug(slug: string) {
  return prisma.itemType.findFirst({
    where: {
      slug,
      isSystem: true,
    },
    select: {
      id: true,
    },
  });
}

async function createItemRecord(input: {
  data: Omit<CreateItemData, "tags" | "typeSlug"> & {
    contentType: "TEXT" | "URL";
    itemTypeId: string;
  };
  userId: string;
}) {
  return prisma.item.create({
    data: {
      ...input.data,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });
}

async function deleteItemRecord(itemId: string) {
  await prisma.item.delete({
    where: {
      id: itemId,
    },
  });
}

function createCreateItemDeps() {
  return {
    createItemRecord,
    createItemTags,
    findItemDetail,
    findItemTypeBySlug,
    upsertTag,
  } satisfies CreateItemDeps;
}

function createUpdateItemDeps() {
  return {
    findOwnedItem,
    updateItemFields,
    deleteItemTags,
    upsertTag,
    createItemTags,
    findItemDetail,
  } satisfies UpdateItemDeps;
}

function createDeleteItemDeps() {
  return {
    findOwnedItem,
    deleteItemRecord,
  } satisfies DeleteItemDeps;
}

export async function createItem(
  input: CreateItemInput,
  deps: CreateItemDeps = createCreateItemDeps(),
): Promise<ItemDetail | null> {
  const itemType = await deps.findItemTypeBySlug(input.data.typeSlug);

  if (!itemType) {
    return null;
  }

  const item = await deps.createItemRecord({
    userId: input.userId,
    data: getCreateItemFields(input.data, itemType.id),
  });
  const normalizedTags = normalizeItemTags(input.data.tags);
  const tagIds = [];

  for (const tag of normalizedTags) {
    const persistedTag = await deps.upsertTag({
      ...tag,
      userId: input.userId,
    });
    tagIds.push(persistedTag.id);
  }

  await deps.createItemTags({
    itemId: item.id,
    tagIds,
  });

  const createdItem = await deps.findItemDetail({
    itemId: item.id,
    userId: input.userId,
  });

  return createdItem ? toItemDetail(createdItem) : null;
}

export async function updateItem(
  input: UpdateItemInput,
  deps: UpdateItemDeps = createUpdateItemDeps(),
): Promise<ItemDetail | null> {
  const item = await deps.findOwnedItem({
    itemId: input.itemId,
    userId: input.userId,
  });

  if (!item) {
    return null;
  }

  const { tags, ...fieldData } = input.data;
  const normalizedTags = normalizeItemTags(tags);

  await deps.updateItemFields({
    itemId: input.itemId,
    data: fieldData,
  });
  await deps.deleteItemTags(input.itemId);

  const tagIds = [];

  for (const tag of normalizedTags) {
    const persistedTag = await deps.upsertTag({
      ...tag,
      userId: input.userId,
    });
    tagIds.push(persistedTag.id);
  }

  await deps.createItemTags({
    itemId: input.itemId,
    tagIds,
  });

  const updatedItem = await deps.findItemDetail({
    itemId: input.itemId,
    userId: input.userId,
  });

  return updatedItem ? toItemDetail(updatedItem) : null;
}

export async function deleteItem(
  input: DeleteItemInput,
  deps: DeleteItemDeps = createDeleteItemDeps(),
) {
  const item = await deps.findOwnedItem({
    itemId: input.itemId,
    userId: input.userId,
  });

  if (!item) {
    return false;
  }

  await deps.deleteItemRecord(input.itemId);

  return true;
}
