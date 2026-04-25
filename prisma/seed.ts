import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, ItemContentType, PlanTier } from "../src/generated/prisma/client";
import {
  collections,
  currentUser,
  items,
  itemTypes,
  type ItemTypeSlug,
} from "../src/lib/mock-data";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const typeIdBySlug = new Map<ItemTypeSlug, string>(
  itemTypes.map((itemType) => [itemType.slug, itemType.id]),
);

function toContentType(slug: ItemTypeSlug) {
  const storageMode = itemTypes.find((itemType) => itemType.slug === slug)?.storageMode;

  if (storageMode === "url") {
    return ItemContentType.URL;
  }

  if (storageMode === "file") {
    return ItemContentType.FILE;
  }

  return ItemContentType.TEXT;
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dateFromLabel(label: string) {
  const date = new Date(`${label}, 2026 12:00:00 UTC`);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

async function main() {
  await prisma.user.upsert({
    where: { id: currentUser.id },
    update: {
      name: currentUser.name,
      email: currentUser.email,
      image: currentUser.avatarUrl,
      planTier: currentUser.planTier === "pro" ? PlanTier.PRO : PlanTier.FREE,
      isPro: currentUser.planTier === "pro",
    },
    create: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      image: currentUser.avatarUrl,
      planTier: currentUser.planTier === "pro" ? PlanTier.PRO : PlanTier.FREE,
      isPro: currentUser.planTier === "pro",
    },
  });

  for (const itemType of itemTypes) {
    await prisma.itemType.upsert({
      where: { id: itemType.id },
      update: {
        name: itemType.singularName,
        slug: itemType.slug,
        icon: itemType.icon,
        color: itemType.color,
        isSystem: true,
        userId: null,
      },
      create: {
        id: itemType.id,
        name: itemType.singularName,
        slug: itemType.slug,
        icon: itemType.icon,
        color: itemType.color,
        isSystem: true,
      },
    });
  }

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { id: collection.id },
      update: {
        userId: currentUser.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        isFavorite: collection.isFavorite,
        defaultTypeId: typeIdBySlug.get(collection.itemTypeSlugs[0]) ?? null,
        updatedAt: dateFromLabel(collection.updatedAt),
      },
      create: {
        id: collection.id,
        userId: currentUser.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        isFavorite: collection.isFavorite,
        defaultTypeId: typeIdBySlug.get(collection.itemTypeSlugs[0]) ?? null,
        updatedAt: dateFromLabel(collection.updatedAt),
      },
    });
  }

  for (const item of items) {
    const contentType = toContentType(item.typeSlug);
    const preview = item.preview ?? null;
    const itemTypeId = typeIdBySlug.get(item.typeSlug);

    if (!itemTypeId) {
      throw new Error(`Missing item type for slug: ${item.typeSlug}`);
    }

    await prisma.item.upsert({
      where: { id: item.id },
      update: {
        userId: currentUser.id,
        itemTypeId,
        title: item.title,
        description: item.description,
        contentType,
        content: contentType === ItemContentType.TEXT ? preview : null,
        url: contentType === ItemContentType.URL ? preview : null,
        fileName: contentType === ItemContentType.FILE ? preview : null,
        language: item.language ?? null,
        isFavorite: item.isFavorite,
        isPinned: item.isPinned,
        updatedAt: dateFromLabel(item.updatedAt),
      },
      create: {
        id: item.id,
        userId: currentUser.id,
        itemTypeId,
        title: item.title,
        description: item.description,
        contentType,
        content: contentType === ItemContentType.TEXT ? preview : null,
        url: contentType === ItemContentType.URL ? preview : null,
        fileName: contentType === ItemContentType.FILE ? preview : null,
        language: item.language ?? null,
        isFavorite: item.isFavorite,
        isPinned: item.isPinned,
        updatedAt: dateFromLabel(item.updatedAt),
      },
    });

    for (const tagName of item.tags) {
      const tagSlug = toSlug(tagName);
      const tag = await prisma.tag.upsert({
        where: {
          userId_slug: {
            userId: currentUser.id,
            slug: tagSlug,
          },
        },
        update: {
          name: tagName,
        },
        create: {
          userId: currentUser.id,
          name: tagName,
          slug: tagSlug,
        },
      });

      await prisma.itemTag.upsert({
        where: {
          itemId_tagId: {
            itemId: item.id,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          itemId: item.id,
          tagId: tag.id,
        },
      });
    }

    for (const collectionSlug of item.collectionSlugs) {
      const collection = collections.find((entry) => entry.slug === collectionSlug);

      if (!collection) {
        continue;
      }

      await prisma.itemCollection.upsert({
        where: {
          itemId_collectionId: {
            itemId: item.id,
            collectionId: collection.id,
          },
        },
        update: {},
        create: {
          itemId: item.id,
          collectionId: collection.id,
        },
      });
    }
  }

  const [userCount, itemTypeCount, collectionCount, itemCount, tagCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.itemType.count(),
      prisma.collection.count(),
      prisma.item.count(),
      prisma.tag.count(),
    ]);

  console.log(
    `Seeded ${userCount} user, ${itemTypeCount} item types, ${collectionCount} collections, ${itemCount} items, and ${tagCount} tags.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
