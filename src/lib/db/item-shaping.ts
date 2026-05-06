export type ItemTypeRecord = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
};

export type ItemTypeRecordWithCount = ItemTypeRecord & {
  itemCount: number;
};

export type DashboardItemType = ItemTypeRecord & {
  label: string;
  href: string;
  itemCount: number;
};

export type ItemRecord = {
  id: string;
  title: string;
  description: string | null;
  content?: string | null;
  url?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileUrl?: string | null;
  language?: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemType: ItemTypeRecord;
  collections: {
    collection: {
      name: string;
      slug: string;
    };
  }[];
  tags: {
    tag: {
      name: string;
      slug: string;
    };
  }[];
};

export type ItemDetailRecord = Omit<
  ItemRecord,
  "collections" | "content" | "fileName" | "fileUrl" | "language" | "url"
> & {
  contentType: "TEXT" | "URL" | "FILE";
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  language: string | null;
  createdAt: Date;
  collections: {
    collection: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
};

export type DashboardItem = {
  id: string;
  title: string;
  description: string;
  typeSlug: string;
  itemType: ItemTypeRecord;
  collectionSlugs: string[];
  collectionNames: string[];
  tags: string[];
  createdAtLabel: string;
  updatedAt: string;
  isPinned: boolean;
  isFavorite: boolean;
  fileName: string | null;
  fileSize: number | null;
  language?: string;
  preview: string;
  accentColor: string;
};

export type ItemDetail = {
  id: string;
  title: string;
  description: string;
  contentType: "TEXT" | "URL" | "FILE";
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language?: string;
  typeSlug: string;
  itemType: ItemTypeRecord;
  collections: {
    id: string;
    name: string;
    slug: string;
  }[];
  tags: {
    name: string;
    slug: string;
  }[];
  createdAt: string;
  updatedAt: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  isPinned: boolean;
  isFavorite: boolean;
  accentColor: string;
};

const dashboardItemTypeOrder = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
] as const;

const dashboardItemTypeRank = new Map<string, number>(
  dashboardItemTypeOrder.map((slug, index) => [slug, index]),
);

function formatUpdatedAt(updatedAt: Date, now: Date) {
  const diffMs = Math.max(0, now.getTime() - updatedAt.getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(updatedAt);
}

function formatDetailDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatListDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getPreview(item: ItemRecord) {
  const textPreview = item.content?.trim();

  if (textPreview) {
    return textPreview;
  }

  if (item.url) {
    return item.url;
  }

  if (item.fileName) {
    return item.fileName;
  }

  if (item.fileUrl) {
    return item.fileUrl;
  }

  return "";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function pluralizeItemType(value: string) {
  if (value.endsWith("s")) {
    return value;
  }

  if (value.endsWith("y")) {
    return `${value.slice(0, -1)}ies`;
  }

  if (value.endsWith("ge")) {
    return `${value}s`;
  }

  return `${value}s`;
}

export function sortDashboardItemTypes<T extends { slug: string }>(
  itemTypes: T[],
) {
  return [...itemTypes].sort((firstItemType, secondItemType) => {
    const firstRank =
      dashboardItemTypeRank.get(firstItemType.slug) ?? Number.MAX_SAFE_INTEGER;
    const secondRank =
      dashboardItemTypeRank.get(secondItemType.slug) ?? Number.MAX_SAFE_INTEGER;
    const rankDifference =
      firstRank - secondRank;

    if (rankDifference !== 0) {
      return rankDifference;
    }

    return firstItemType.slug.localeCompare(secondItemType.slug);
  });
}

export function toDashboardItemType(itemType: ItemTypeRecordWithCount) {
  const pluralName = pluralizeItemType(itemType.name);

  return {
    id: itemType.id,
    name: itemType.name,
    slug: itemType.slug,
    label: capitalize(pluralName),
    href: `/items/${pluralizeItemType(itemType.slug)}`,
    icon: itemType.icon,
    color: itemType.color,
    itemCount: itemType.itemCount,
  } satisfies DashboardItemType;
}

export function toDashboardItem(item: ItemRecord, now = new Date()) {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "No description yet.",
    typeSlug: item.itemType.slug,
    itemType: item.itemType,
    collectionSlugs: item.collections.map(({ collection }) => collection.slug),
    collectionNames: item.collections.map(({ collection }) => collection.name),
    tags: item.tags.map(({ tag }) => tag.name),
    createdAtLabel: formatListDate(item.createdAt),
    updatedAt: formatUpdatedAt(item.updatedAt, now),
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    fileName: item.fileName ?? null,
    fileSize: item.fileSize ?? null,
    language: item.language ?? undefined,
    preview: getPreview(item),
    accentColor: item.itemType.color,
  } satisfies DashboardItem;
}

export function toItemDetail(item: ItemDetailRecord) {
  return {
    id: item.id,
    title: item.title,
    description: item.description ?? "No description yet.",
    contentType: item.contentType,
    content: item.content ?? null,
    url: item.url ?? null,
    fileUrl: item.fileUrl ?? null,
    fileName: item.fileName ?? null,
    fileSize: item.fileSize,
    language: item.language ?? undefined,
    typeSlug: item.itemType.slug,
    itemType: item.itemType,
    collections: item.collections.map(({ collection }) => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
    })),
    tags: item.tags.map(({ tag }) => ({
      name: tag.name,
      slug: tag.slug,
    })),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    createdAtLabel: formatDetailDate(item.createdAt),
    updatedAtLabel: formatDetailDate(item.updatedAt),
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    accentColor: item.itemType.color,
  } satisfies ItemDetail;
}
