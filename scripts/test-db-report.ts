import { seedCollections, seedItemTypes } from "../prisma/seed-data";

export type DemoDataReport = {
  host: string;
  database: string;
  adapter: "pg" | "neon";
  counts: {
    users: number;
    itemTypes: number;
    collections: number;
    items: number;
    tags: number;
  };
  demoUser: {
    name: string | null;
    email: string;
    isPro: boolean;
    emailVerified: boolean;
    itemTypes: {
      name: string;
      slug: string;
      icon: string;
      color: string;
    }[];
    collections: {
      name: string;
      slug: string;
      description: string | null;
      items: {
        id: string;
        title: string;
        type: string;
        contentType: string;
        url?: string | null;
        tags: string[];
      }[];
    }[];
  };
};

export function assertDemoDataMatchesSeedSpec(demoUser: DemoDataReport["demoUser"]) {
  const itemTypeSlugs = new Set(demoUser.itemTypes.map((itemType) => itemType.slug));
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

  for (const expectedCollection of seedCollections) {
    const actualCollection = collectionsBySlug.get(expectedCollection.slug);

    if (!actualCollection) {
      continue;
    }

    const expectedItemIds = new Set(expectedCollection.items.map((item) => item.id));
    const actualItemIds = new Set(actualCollection.items.map((item) => item.id));
    const missingItems = expectedCollection.items
      .map((item) => item.id)
      .filter((id) => !actualItemIds.has(id));
    const unexpectedItems = actualCollection.items
      .map((item) => item.id)
      .filter((id) => !expectedItemIds.has(id));

    if (missingItems.length > 0) {
      throw new Error(`Missing items in ${expectedCollection.name}: ${missingItems.join(", ")}`);
    }

    if (unexpectedItems.length > 0) {
      throw new Error(`Unexpected items in ${expectedCollection.name}: ${unexpectedItems.join(", ")}`);
    }
  }
}

function formatCounts(counts: DemoDataReport["counts"]) {
  return [
    `Users: ${counts.users}`,
    `Item Types: ${counts.itemTypes}`,
    `Collections: ${counts.collections}`,
    `Items: ${counts.items}`,
    `Tags: ${counts.tags}`,
  ].join("\n");
}

function formatItemTypes(itemTypes: DemoDataReport["demoUser"]["itemTypes"]) {
  const rows = itemTypes.map(
    (itemType) => `- ${itemType.name} (${itemType.slug}): ${itemType.icon} ${itemType.color}`,
  );

  return [`System Item Types (${itemTypes.length})`, ...rows].join("\n");
}

function formatCollections(collections: DemoDataReport["demoUser"]["collections"]) {
  const rows = collections.flatMap((collection) => {
    const description = collection.description ? ` - ${collection.description}` : "";
    const items = collection.items.map((item) => {
      const url = item.url ? ` - ${item.url}` : "";
      const tags = item.tags.length > 0 ? ` | tags: ${item.tags.join(", ")}` : "";

      return `  - ${item.title} [${item.type}/${item.contentType}]${url}${tags}`;
    });

    return [`- ${collection.name} (${collection.slug})${description}`, ...items];
  });

  return [`Collections (${collections.length})`, ...rows].join("\n");
}

export function formatDemoDataReport(report: DemoDataReport) {
  return [
    "Database connection OK",
    `Host: ${report.host}`,
    `Database: ${report.database}`,
    `Adapter: ${report.adapter}`,
    "",
    "Counts",
    formatCounts(report.counts),
    "",
    `Demo User: ${report.demoUser.name ?? "Unnamed"} <${report.demoUser.email}>`,
    `Plan: ${report.demoUser.isPro ? "Pro" : "Free"}`,
    `Email Verified: ${report.demoUser.emailVerified ? "yes" : "no"}`,
    "",
    formatItemTypes(report.demoUser.itemTypes),
    "",
    formatCollections(report.demoUser.collections),
  ].join("\n");
}
