import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import ws from "ws";

import { PrismaClient } from "../src/generated/prisma/client";

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

  console.log("Database connection OK");
  console.log(
    JSON.stringify(
      {
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
      },
      null,
      2,
    ),
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
