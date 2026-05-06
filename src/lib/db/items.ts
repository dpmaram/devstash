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

type ItemDbClient = Pick<
  typeof prisma,
  "collection" | "item" | "itemCollection" | "itemTag" | "itemType" | "tag"
>;
type TransactionRunner<TDeps> = <T>(
  callback: (deps: TDeps) => Promise<T>,
) => Promise<T>;

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

type DashboardItemsByCollectionOptions = Pick<
  DashboardItemsOptions,
  "limit" | "user" | "userEmail"
> & {
  collectionSlug: string;
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
  collectionIds?: string[];
  content: string | null;
  description: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileUrl?: string | null;
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
  collectionIds?: string[];
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

export type DeletedItem = {
  fileUrl: string | null;
  id: string;
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
  runTransaction?: TransactionRunner<CreateItemDeps>;
  createItemRecord: (input: {
    data: Omit<CreateItemData, "tags" | "typeSlug"> & {
      contentType: "FILE" | "TEXT" | "URL";
      itemTypeId: string;
    };
    userId: string;
  }) => Promise<CreatedItemRecord>;
  createItemTags: (input: {
    itemId: string;
    tagIds: string[];
  }) => Promise<void>;
  createItemCollections?: (input: {
    collectionIds: string[];
    itemId: string;
  }) => Promise<void>;
  findOwnedCollectionIds?: (input: {
    collectionIds: string[];
    userId: string;
  }) => Promise<string[]>;
  findItemDetail: (input: {
    itemId: string;
    userId: string;
  }) => Promise<ItemDetailRecord | null>;
  findItemTypeBySlug: (slug: string) => Promise<ItemTypeIdRecord | null>;
  upsertTag: (input: NormalizedItemTag & { userId: string }) => Promise<{ id: string }>;
};

type UpdateItemDeps = {
  runTransaction?: TransactionRunner<UpdateItemDeps>;
  findOwnedItem: (input: {
    itemId: string;
    userId: string;
  }) => Promise<{ id: string } | null>;
  updateItemFields: (input: {
    data: Omit<UpdateItemData, "tags">;
    itemId: string;
  }) => Promise<void>;
  deleteItemTags: (itemId: string) => Promise<void>;
  deleteItemCollections?: (itemId: string) => Promise<void>;
  upsertTag: (input: NormalizedItemTag & { userId: string }) => Promise<{ id: string }>;
  createItemTags: (input: {
    itemId: string;
    tagIds: string[];
  }) => Promise<void>;
  createItemCollections?: (input: {
    collectionIds: string[];
    itemId: string;
  }) => Promise<void>;
  findOwnedCollectionIds?: (input: {
    collectionIds: string[];
    userId: string;
  }) => Promise<string[]>;
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
  }) => Promise<DeletedItem | null>;
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

export function normalizeItemCollectionIds(collectionIds: string[] | undefined) {
  if (!collectionIds) {
    return [];
  }

  return [...new Set(collectionIds.map((collectionId) => collectionId.trim()))]
    .filter(Boolean);
}

function getUpdateItemFields(data: UpdateItemData) {
  return {
    title: data.title,
    description: data.description,
    content: data.content,
    url: data.url,
    language: data.language,
  };
}

function getCreateItemContentType(typeSlug: string): "FILE" | "TEXT" | "URL" {
  if (typeSlug === "link") {
    return "URL";
  }

  if (typeSlug === "file" || typeSlug === "image") {
    return "FILE";
  }

  return "TEXT";
}

function getCreateItemFields(data: CreateItemData, itemTypeId: string) {
  const contentType = getCreateItemContentType(data.typeSlug);

  return {
    title: data.title,
    description: data.description,
    contentType,
    content: contentType === "TEXT" ? data.content : null,
    url: contentType === "URL" ? data.url : null,
    fileUrl: contentType === "FILE" ? data.fileUrl ?? null : null,
    fileName: contentType === "FILE" ? data.fileName ?? null : null,
    fileSize: contentType === "FILE" ? data.fileSize ?? null : null,
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

export async function getDashboardItemsByCollectionSlug(
  options: DashboardItemsByCollectionOptions,
) {
  const user = await resolveDashboardUser(options);

  if (!user) {
    return [];
  }

  const collectionSlug = options.collectionSlug.trim().toLowerCase();
  const items = await prisma.item.findMany({
    where: {
      userId: user.id,
      collections: {
        some: {
          collection: {
            slug: collectionSlug,
            userId: user.id,
          },
        },
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

async function findOwnedItem(
  db: ItemDbClient,
  input: { itemId: string; userId: string },
) {
  return db.item.findFirst({
    where: {
      id: input.itemId,
      userId: input.userId,
    },
    select: {
      id: true,
      fileUrl: true,
    },
  });
}

async function updateItemFields(input: {
  db: ItemDbClient;
  data: Omit<UpdateItemData, "tags">;
  itemId: string;
}) {
  await input.db.item.update({
    where: {
      id: input.itemId,
    },
    data: input.data,
  });
}

async function deleteItemTags(db: ItemDbClient, itemId: string) {
  await db.itemTag.deleteMany({
    where: {
      itemId,
    },
  });
}

async function upsertTag(
  db: ItemDbClient,
  input: NormalizedItemTag & { userId: string },
) {
  return db.tag.upsert({
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

async function createItemTags(
  db: ItemDbClient,
  input: { itemId: string; tagIds: string[] },
) {
  if (input.tagIds.length === 0) {
    return;
  }

  await db.itemTag.createMany({
    data: input.tagIds.map((tagId) => ({
      itemId: input.itemId,
      tagId,
    })),
    skipDuplicates: true,
  });
}

async function findOwnedCollectionIds(
  db: ItemDbClient,
  input: { collectionIds: string[]; userId: string },
) {
  if (input.collectionIds.length === 0) {
    return [];
  }

  const collections = await db.collection.findMany({
    where: {
      id: {
        in: input.collectionIds,
      },
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  return collections.map((collection) => collection.id);
}

async function createItemCollections(
  db: ItemDbClient,
  input: { collectionIds: string[]; itemId: string },
) {
  if (input.collectionIds.length === 0) {
    return;
  }

  await db.itemCollection.createMany({
    data: input.collectionIds.map((collectionId) => ({
      collectionId,
      itemId: input.itemId,
    })),
    skipDuplicates: true,
  });
}

async function deleteItemCollections(db: ItemDbClient, itemId: string) {
  await db.itemCollection.deleteMany({
    where: {
      itemId,
    },
  });
}

async function findItemDetail(
  db: ItemDbClient,
  input: { itemId: string; userId: string },
) {
  return db.item.findFirst({
    where: {
      id: input.itemId,
      userId: input.userId,
    },
    select: itemDetailSelect,
  });
}

async function findItemTypeBySlug(db: ItemDbClient, slug: string) {
  return db.itemType.findFirst({
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
  db: ItemDbClient;
    data: Omit<CreateItemData, "tags" | "typeSlug"> & {
      contentType: "FILE" | "TEXT" | "URL";
      itemTypeId: string;
    };
  userId: string;
}) {
  return input.db.item.create({
    data: {
      ...input.data,
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });
}

async function deleteItemRecord(db: ItemDbClient, itemId: string) {
  await db.item.delete({
    where: {
      id: itemId,
    },
  });
}

function createCreateItemDeps(
  db: ItemDbClient = prisma,
  includeTransaction = true,
) {
  const deps: CreateItemDeps = {
    createItemRecord: (input) => createItemRecord({ ...input, db }),
    createItemCollections: (input) => createItemCollections(db, input),
    createItemTags: (input) => createItemTags(db, input),
    findOwnedCollectionIds: (input) => findOwnedCollectionIds(db, input),
    findItemDetail: (input) => findItemDetail(db, input),
    findItemTypeBySlug: (slug) => findItemTypeBySlug(db, slug),
    upsertTag: (input) => upsertTag(db, input),
  };

  if (includeTransaction) {
    deps.runTransaction = (callback) =>
      prisma.$transaction((tx) => callback(createCreateItemDeps(tx, false)));
  }

  return deps;
}

function createUpdateItemDeps(
  db: ItemDbClient = prisma,
  includeTransaction = true,
) {
  const deps: UpdateItemDeps = {
    findOwnedItem: (input) => findOwnedItem(db, input),
    updateItemFields: (input) => updateItemFields({ ...input, db }),
    deleteItemCollections: (itemId) => deleteItemCollections(db, itemId),
    deleteItemTags: (itemId) => deleteItemTags(db, itemId),
    upsertTag: (input) => upsertTag(db, input),
    createItemCollections: (input) => createItemCollections(db, input),
    createItemTags: (input) => createItemTags(db, input),
    findOwnedCollectionIds: (input) => findOwnedCollectionIds(db, input),
    findItemDetail: (input) => findItemDetail(db, input),
  };

  if (includeTransaction) {
    deps.runTransaction = (callback) =>
      prisma.$transaction((tx) => callback(createUpdateItemDeps(tx, false)));
  }

  return deps;
}

function createDeleteItemDeps(db: ItemDbClient = prisma) {
  return {
    findOwnedItem: (input) => findOwnedItem(db, input),
    deleteItemRecord: (itemId) => deleteItemRecord(db, itemId),
  } satisfies DeleteItemDeps;
}

export async function createItem(
  input: CreateItemInput,
  deps: CreateItemDeps = createCreateItemDeps(),
): Promise<ItemDetail | null> {
  if (deps.runTransaction) {
    return deps.runTransaction((transactionDeps) =>
      createItem(input, transactionDeps),
    );
  }

  return createItemWithDeps(input, deps);
}

async function createItemWithDeps(
  input: CreateItemInput,
  deps: CreateItemDeps,
): Promise<ItemDetail | null> {
  const itemType = await deps.findItemTypeBySlug(input.data.typeSlug);

  if (!itemType) {
    return null;
  }

  const collectionIds = await getOwnedCollectionIds({
    collectionIds: input.data.collectionIds,
    findOwnedCollectionIds: deps.findOwnedCollectionIds,
    userId: input.userId,
  });

  if (!collectionIds) {
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

  if (collectionIds.length > 0) {
    if (!deps.createItemCollections) {
      return null;
    }

    await deps.createItemCollections({
      collectionIds,
      itemId: item.id,
    });
  }

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
  if (deps.runTransaction) {
    return deps.runTransaction((transactionDeps) =>
      updateItem(input, transactionDeps),
    );
  }

  return updateItemWithDeps(input, deps);
}

async function updateItemWithDeps(
  input: UpdateItemInput,
  deps: UpdateItemDeps,
): Promise<ItemDetail | null> {
  const item = await deps.findOwnedItem({
    itemId: input.itemId,
    userId: input.userId,
  });

  if (!item) {
    return null;
  }

  let collectionIds: string[] | undefined;
  const createItemCollections = deps.createItemCollections;
  const deleteItemCollections = deps.deleteItemCollections;

  if (input.data.collectionIds !== undefined) {
    const ownedCollectionIds = await getOwnedCollectionIds({
      collectionIds: input.data.collectionIds,
      findOwnedCollectionIds: deps.findOwnedCollectionIds,
      userId: input.userId,
    });

    if (!ownedCollectionIds || !deleteItemCollections) {
      return null;
    }

    if (ownedCollectionIds.length > 0 && !createItemCollections) {
      return null;
    }

    collectionIds = ownedCollectionIds;
  }

  const { tags } = input.data;
  const normalizedTags = normalizeItemTags(tags);

  await deps.updateItemFields({
    itemId: input.itemId,
    data: getUpdateItemFields(input.data),
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

  if (collectionIds !== undefined) {
    await deleteItemCollections?.(input.itemId);

    if (collectionIds.length > 0) {
      await createItemCollections?.({
        collectionIds,
        itemId: input.itemId,
      });
    }
  }

  const updatedItem = await deps.findItemDetail({
    itemId: input.itemId,
    userId: input.userId,
  });

  return updatedItem ? toItemDetail(updatedItem) : null;
}

async function getOwnedCollectionIds(input: {
  collectionIds: string[] | undefined;
  findOwnedCollectionIds: CreateItemDeps["findOwnedCollectionIds"];
  userId: string;
}) {
  const collectionIds = normalizeItemCollectionIds(input.collectionIds);

  if (collectionIds.length === 0) {
    return collectionIds;
  }

  if (!input.findOwnedCollectionIds) {
    return null;
  }

  const ownedCollectionIds = await input.findOwnedCollectionIds({
    collectionIds,
    userId: input.userId,
  });
  const ownedCollectionIdSet = new Set(ownedCollectionIds);

  if (ownedCollectionIdSet.size !== collectionIds.length) {
    return null;
  }

  return collectionIds.every((collectionId) =>
    ownedCollectionIdSet.has(collectionId),
  )
    ? collectionIds
    : null;
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

  return item;
}
