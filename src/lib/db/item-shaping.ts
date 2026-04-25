export type ItemTypeRecord = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
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
