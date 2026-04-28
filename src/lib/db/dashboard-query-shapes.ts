export const dashboardItemTypeSelect = {
  id: true,
  name: true,
  slug: true,
  icon: true,
  color: true,
} as const;

export const dashboardItemListSelect = {
  id: true,
  title: true,
  description: true,
  isPinned: true,
  isFavorite: true,
  updatedAt: true,
  itemType: {
    select: dashboardItemTypeSelect,
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

export const itemDetailSelect = {
  id: true,
  title: true,
  description: true,
  contentType: true,
  content: true,
  url: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
  language: true,
  isPinned: true,
  isFavorite: true,
  createdAt: true,
  updatedAt: true,
  itemType: {
    select: dashboardItemTypeSelect,
  },
  collections: {
    orderBy: { addedAt: "asc" },
    select: {
      collection: {
        select: {
          id: true,
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

export const dashboardCollectionSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isFavorite: true,
  updatedAt: true,
  defaultType: {
    select: dashboardItemTypeSelect,
  },
  _count: {
    select: {
      items: true,
    },
  },
} as const;

export const dashboardCollectionTypeSummarySelect = {
  collectionId: true,
  item: {
    select: {
      itemType: {
        select: dashboardItemTypeSelect,
      },
    },
  },
} as const;
