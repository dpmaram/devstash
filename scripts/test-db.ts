import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import ws from "ws";

import {
  seedCollections,
  seedItemTypes,
  seedUser,
} from "../prisma/seed-data";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  assertDemoDataMatchesSeedSpec,
  formatDemoDataReport,
  type DemoDataReport,
} from "./test-db-report";

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is required to test the database.");
}

const databaseUrl = new URL(connectionString);
const isLocalDatabase =
  databaseUrl.hostname === "localhost" ||
  databaseUrl.hostname === "127.0.0.1" ||
  databaseUrl.hostname === "::1";

const adapter = isLocalDatabase
  ? new PrismaPg({ connectionString })
  : new PrismaNeon({ connectionString });

if (!isLocalDatabase) {
  neonConfig.webSocketConstructor = ws;
}

const prisma = new PrismaClient({ adapter });

type HealthCheckRow = {
  ok: number;
};

const itemTypeOrder = new Map(seedItemTypes.map((itemType, index) => [itemType.slug, index]));
const collectionOrder = new Map(
  seedCollections.map((collection, index) => [collection.slug, index]),
);

function sortBySeedOrder<T>(
  values: T[],
  getSlug: (value: T) => string,
  order: Map<string, number>,
) {
  return values.toSorted((first, second) => {
    const firstOrder = order.get(getSlug(first)) ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = order.get(getSlug(second)) ?? Number.MAX_SAFE_INTEGER;

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    return getSlug(first).localeCompare(getSlug(second));
  });
}

function assertSeedDataPresent(
  systemItemTypes: { slug: string }[],
  demoUser: {
    passwordHash: string | null;
    collections: {
      slug: string;
      items: {
        item: {
          id: string;
        };
      }[];
    }[];
  } | null,
) {
  if (!demoUser) {
    throw new Error(`Demo user ${seedUser.email} was not found. Run npm run db:seed first.`);
  }

  if (!demoUser.passwordHash) {
    throw new Error(`Demo user ${seedUser.email} does not have a password hash.`);
  }

  const itemTypeSlugs = new Set(systemItemTypes.map((itemType) => itemType.slug));
  const missingItemTypes = seedItemTypes
    .map((itemType) => itemType.slug)
    .filter((slug) => !itemTypeSlugs.has(slug));

  if (missingItemTypes.length > 0) {
    throw new Error(`Missing seeded item types: ${missingItemTypes.join(", ")}`);
  }

  const collectionsBySlug = new Map(
    demoUser.collections.map((collection) => [collection.slug, collection]),
  );
  const missingCollections = seedCollections
    .map((collection) => collection.slug)
    .filter((slug) => !collectionsBySlug.has(slug));

  if (missingCollections.length > 0) {
    throw new Error(`Missing seeded collections: ${missingCollections.join(", ")}`);
  }

  const itemIds = new Set(
    demoUser.collections.flatMap((collection) =>
      collection.items.map((itemCollection) => itemCollection.item.id),
    ),
  );
  const missingItems = seedCollections
    .flatMap((collection) => collection.items)
    .map((item) => item.id)
    .filter((id) => !itemIds.has(id));

  if (missingItems.length > 0) {
    throw new Error(`Missing seeded items: ${missingItems.join(", ")}`);
  }
}

async function fetchDemoData(): Promise<DemoDataReport["demoUser"]> {
  const [systemItemTypes, demoUser] = await Promise.all([
    prisma.itemType.findMany({
      where: {
        isSystem: true,
      },
      select: {
        name: true,
        slug: true,
        icon: true,
        color: true,
      },
    }),
    prisma.user.findUnique({
      where: {
        email: seedUser.email,
      },
      select: {
        name: true,
        email: true,
        emailVerified: true,
        passwordHash: true,
        isPro: true,
        collections: {
          select: {
            name: true,
            slug: true,
            description: true,
            items: {
              select: {
                item: {
                  select: {
                    id: true,
                    title: true,
                    contentType: true,
                    url: true,
                    itemType: {
                      select: {
                        slug: true,
                      },
                    },
                    tags: {
                      select: {
                        tag: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  assertSeedDataPresent(systemItemTypes, demoUser);

  if (!demoUser?.email) {
    throw new Error(`Demo user ${seedUser.email} is missing an email address.`);
  }

  return {
    name: demoUser.name,
    email: demoUser.email,
    isPro: demoUser.isPro,
    emailVerified: Boolean(demoUser.emailVerified),
    itemTypes: sortBySeedOrder(systemItemTypes, (itemType) => itemType.slug, itemTypeOrder),
    collections: sortBySeedOrder(demoUser.collections, (collection) => collection.slug, collectionOrder).map(
      (collection) => ({
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        items: collection.items
          .map((itemCollection) => itemCollection.item)
          .toSorted((first, second) => first.title.localeCompare(second.title))
          .map((item) => ({
            id: item.id,
            title: item.title,
            type: item.itemType.slug,
            contentType: item.contentType,
            url: item.url,
            tags: item.tags
              .map((itemTag) => itemTag.tag.name)
              .toSorted((first, second) => first.localeCompare(second)),
          })),
      }),
    ),
  };
}

async function main() {
  const healthCheck = await prisma.$queryRaw<HealthCheckRow[]>`select 1::int as ok`;

  if (healthCheck[0]?.ok !== 1) {
    throw new Error("Database health check query returned an unexpected result.");
  }

  const [users, itemTypes, collections, items, tags] = await Promise.all([
    prisma.user.count(),
    prisma.itemType.count(),
    prisma.collection.count(),
    prisma.item.count(),
    prisma.tag.count(),
  ]);
  const demoUser = await fetchDemoData();

  assertDemoDataMatchesSeedSpec(demoUser);

  console.log(
    formatDemoDataReport({
      host: databaseUrl.host,
      database: databaseUrl.pathname.slice(1),
      adapter: isLocalDatabase ? "pg" : "neon",
      counts: {
        users,
        itemTypes,
        collections,
        items,
        tags,
      },
      demoUser,
    }),
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
