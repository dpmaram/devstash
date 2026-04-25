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
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileUrl: string | null;
  language: string | null;
  isPinned: boolean;
  isFavorite: boolean;
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

export type DashboardItem = {
  id: string;
  title: string;
  description: string;
  typeSlug: string;
  itemType: ItemTypeRecord;
  collectionSlugs: string[];
  collectionNames: string[];
  tags: string[];
  updatedAt: string;
  isPinned: boolean;
  isFavorite: boolean;
  language?: string;
  preview: string;
  accentColor: string;
};

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
    updatedAt: formatUpdatedAt(item.updatedAt, now),
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    language: item.language ?? undefined,
    preview: getPreview(item),
    accentColor: item.itemType.color,
  } satisfies DashboardItem;
}
