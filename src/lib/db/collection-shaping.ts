export type CollectionItemType = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
};

export type CollectionRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  defaultType: CollectionItemType | null;
  items: {
    item: {
      id: string;
      itemType: CollectionItemType;
    };
  }[];
};

export type DashboardCollection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  itemCount: number;
  isFavorite: boolean;
  accentColor: string;
  updatedAt: string;
  types: CollectionItemType[];
};

export type DashboardStat = {
  label: string;
  value: string;
  detail: string;
};

export type DashboardStatsInput = {
  itemCount: number;
  collectionCount: number;
  favoriteCollectionCount: number;
  pinnedItemCount: number;
  promptItemCount: number;
};

const fallbackType: CollectionItemType = {
  id: "type_unknown",
  name: "note",
  slug: "note",
  icon: "StickyNote",
  color: "#fde047",
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

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

function getCollectionTypes(collection: CollectionRecord) {
  const typesBySlug = new Map<string, CollectionItemType>();

  for (const collectionItem of collection.items) {
    const itemType = collectionItem.item.itemType;

    if (!typesBySlug.has(itemType.slug)) {
      typesBySlug.set(itemType.slug, itemType);
    }
  }

  if (typesBySlug.size > 0) {
    return [...typesBySlug.values()];
  }

  return [collection.defaultType ?? fallbackType];
}

function getMostUsedType(collection: CollectionRecord) {
  const countsBySlug = new Map<string, number>();
  const typesBySlug = new Map<string, CollectionItemType>();
  let mostUsedType: CollectionItemType | null = null;
  let mostUsedCount = 0;

  for (const collectionItem of collection.items) {
    const itemType = collectionItem.item.itemType;
    const count = (countsBySlug.get(itemType.slug) ?? 0) + 1;

    countsBySlug.set(itemType.slug, count);
    typesBySlug.set(itemType.slug, itemType);

    if (count > mostUsedCount) {
      mostUsedCount = count;
      mostUsedType = itemType;
    }
  }

  return mostUsedType ?? collection.defaultType ?? fallbackType;
}

export function toDashboardCollection(collection: CollectionRecord, now = new Date()) {
  const mostUsedType = getMostUsedType(collection);

  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description ?? "No description yet.",
    itemCount: collection.items.length,
    isFavorite: collection.isFavorite,
    accentColor: mostUsedType.color,
    updatedAt: formatUpdatedAt(collection.updatedAt, now),
    types: getCollectionTypes(collection),
  } satisfies DashboardCollection;
}

export function buildDashboardStats(input: DashboardStatsInput) {
  return [
    {
      label: "Items",
      value: input.itemCount.toLocaleString("en-US"),
      detail: "Saved total",
    },
    {
      label: "Collections",
      value: input.collectionCount.toLocaleString("en-US"),
      detail: pluralize(input.favoriteCollectionCount, "favorite"),
    },
    {
      label: "Pinned",
      value: input.pinnedItemCount.toLocaleString("en-US"),
      detail: "Top shelf",
    },
    {
      label: "Prompts",
      value: input.promptItemCount.toLocaleString("en-US"),
      detail: "AI-ready",
    },
  ] satisfies DashboardStat[];
}
