import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { ItemContentType, PlanTier, PrismaClient } from "../src/generated/prisma/client";
import {
  seedCollections,
  seedItemTypes,
  seedUser,
  type SeedItem,
  type SeedItemTypeSlug,
} from "./seed-data";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const typeIdBySlug = new Map<SeedItemTypeSlug, string>(
  seedItemTypes.map((itemType) => [itemType.slug, itemType.id]),
);

const contentTypeBySlug: Record<SeedItemTypeSlug, ItemContentType> = {
  snippet: ItemContentType.TEXT,
  prompt: ItemContentType.TEXT,
  command: ItemContentType.TEXT,
  note: ItemContentType.TEXT,
  file: ItemContentType.FILE,
  image: ItemContentType.FILE,
  link: ItemContentType.URL,
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getItemTypeId(typeSlug: SeedItemTypeSlug) {
  const itemTypeId = typeIdBySlug.get(typeSlug);

  if (!itemTypeId) {
    throw new Error(`Missing item type for slug: ${typeSlug}`);
  }

  return itemTypeId;
}

function getTextContent(item: SeedItem, contentType: ItemContentType) {
  if (contentType === ItemContentType.TEXT) {
    return item.content ?? "";
  }

  return null;
}

function getUrl(item: SeedItem, contentType: ItemContentType) {
  if (contentType === ItemContentType.URL) {
    if (!item.url) {
      throw new Error(`Missing URL for link item: ${item.id}`);
    }

    return item.url;
  }

  return null;
}

async function seedDemoUser() {
  const passwordHash = await bcrypt.hash(seedUser.password, 12);

  return prisma.user.upsert({
    where: { email: seedUser.email },
    update: {
      name: seedUser.name,
      emailVerified: new Date(),
      passwordHash,
      planTier: PlanTier.FREE,
      isPro: seedUser.isPro,
    },
    create: {
      id: "user_demo",
      name: seedUser.name,
      email: seedUser.email,
      emailVerified: new Date(),
      passwordHash,
      planTier: PlanTier.FREE,
      isPro: seedUser.isPro,
    },
  });
}

async function seedSystemItemTypes() {
  for (const itemType of seedItemTypes) {
    await prisma.itemType.upsert({
      where: { id: itemType.id },
      update: {
        name: itemType.name,
        slug: itemType.slug,
        icon: itemType.icon,
        color: itemType.color,
        isSystem: true,
        userId: null,
      },
      create: {
        id: itemType.id,
        name: itemType.name,
        slug: itemType.slug,
        icon: itemType.icon,
        color: itemType.color,
        isSystem: true,
      },
    });
  }
}

async function seedDemoCollections(userId: string) {
  for (const collection of seedCollections) {
    await prisma.collection.upsert({
      where: { id: collection.id },
      update: {
        userId,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        isFavorite: collection.isFavorite,
        defaultTypeId: getItemTypeId(collection.defaultTypeSlug),
      },
      create: {
        id: collection.id,
        userId,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        isFavorite: collection.isFavorite,
        defaultTypeId: getItemTypeId(collection.defaultTypeSlug),
      },
    });
  }
}

async function resetDemoUserContent(userId: string) {
  await prisma.item.deleteMany({
    where: {
      userId,
    },
  });

  await prisma.collection.deleteMany({
    where: {
      userId,
    },
  });

  await prisma.tag.deleteMany({
    where: {
      userId,
    },
  });
}

async function clearSeedItemRelationships() {
  const itemIds = seedCollections.flatMap((collection) =>
    collection.items.map((item) => item.id),
  );
  const collectionIds = seedCollections.map((collection) => collection.id);

  await prisma.itemTag.deleteMany({
    where: {
      itemId: {
        in: itemIds,
      },
    },
  });

  await prisma.itemCollection.deleteMany({
    where: {
      OR: [
        {
          itemId: {
            in: itemIds,
          },
        },
        {
          collectionId: {
            in: collectionIds,
          },
        },
      ],
    },
  });
}

async function seedItemTags(userId: string, item: SeedItem) {
  for (const tagName of item.tags) {
    const tagSlug = toSlug(tagName);
    const tag = await prisma.tag.upsert({
      where: {
        userId_slug: {
          userId,
          slug: tagSlug,
        },
      },
      update: {
        name: tagName,
      },
      create: {
        userId,
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
}

async function seedItems(userId: string) {
  await clearSeedItemRelationships();

  for (const collection of seedCollections) {
    for (const item of collection.items) {
      const contentType = contentTypeBySlug[item.typeSlug];
      const itemTypeId = getItemTypeId(item.typeSlug);
      const content = getTextContent(item, contentType);
      const url = getUrl(item, contentType);

      await prisma.item.upsert({
        where: { id: item.id },
        update: {
          userId,
          itemTypeId,
          title: item.title,
          description: item.description,
          contentType,
          content,
          url,
          fileUrl: null,
          fileName: null,
          fileSize: null,
          language: item.language ?? null,
          isFavorite: item.isFavorite ?? false,
          isPinned: item.isPinned ?? false,
        },
        create: {
          id: item.id,
          userId,
          itemTypeId,
          title: item.title,
          description: item.description,
          contentType,
          content,
          url,
          language: item.language ?? null,
          isFavorite: item.isFavorite ?? false,
          isPinned: item.isPinned ?? false,
        },
      });

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

      await seedItemTags(userId, item);
    }
  }
}

async function main() {
  const user = await seedDemoUser();

  await seedSystemItemTypes();
  await resetDemoUserContent(user.id);
  await seedDemoCollections(user.id);
  await seedItems(user.id);

  const [itemTypeCount, collectionCount, itemCount, tagCount] = await Promise.all([
    prisma.itemType.count({
      where: {
        id: {
          in: seedItemTypes.map((itemType) => itemType.id),
        },
      },
    }),
    prisma.collection.count({ where: { userId: user.id } }),
    prisma.item.count({ where: { userId: user.id } }),
    prisma.tag.count({ where: { userId: user.id } }),
  ]);

  console.log(
    `Seeded demo user with ${itemTypeCount} item types, ${collectionCount} collections, ${itemCount} items, and ${tagCount} tags.`,
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
