import { prisma } from "@/lib/prisma";
import { type DashboardUser } from "./dashboard-user";

export type SearchItem = {
  id: string;
  title: string;
  type: string;
  typeSlug: string;
  preview: string | null;
  collectionId: string | null;
};

export type SearchCollection = {
  id: string;
  title: string; // Use 'title' for compatibility with SearchableItem
  name: string;
  slug: string;
  itemCount: number;
};

export type SearchIndex = {
  items: SearchItem[];
  collections: SearchCollection[];
};

/**
 * Fetch searchable index data for global search/command palette
 * Returns items and collections for the user
 */
export async function getSearchIndex(
  user: DashboardUser | null,
): Promise<SearchIndex> {
  if (!user?.id) {
    return { items: [], collections: [] };
  }

  // Fetch all items for this user
  const items = await prisma.item.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      itemType: {
        select: {
          name: true,
          slug: true,
        },
      },
      description: true,
      content: true,
      collections: {
        select: {
          collectionId: true,
        },
        take: 1, // Get first collection only for search context
      },
    },
    take: 100, // Limit for performance
  });

  // Fetch all collections for this user with item count
  const collections = await prisma.collection.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.itemType.name,
      typeSlug: item.itemType.slug,
      preview: item.description || item.content?.substring(0, 100) || null,
      collectionId: item.collections[0]?.collectionId || null,
    })),
    collections: collections.map((col) => ({
      id: col.id,
      title: col.name, // Use name as title for fuzzy search
      name: col.name,
      slug: col.slug,
      itemCount: col._count.items,
    })),
  };
}
