import "dotenv/config";
import { pathToFileURL } from "node:url";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import ws from "ws";

import { PrismaClient } from "../src/generated/prisma/client";

export const defaultDemoUserEmail = "demo@devstash.io";

type UserCandidate = {
  id: string;
  email: string | null;
  name: string | null;
};

export type DeleteNonDemoUsersPlan = {
  keepEmail: string;
  keepUser: UserCandidate;
  usersToDelete: UserCandidate[];
  verificationTokenIdentifiersToDelete: string[];
};

export type DeleteNonDemoUsersCounts = {
  users: number;
  accounts: number;
  sessions: number;
  itemTypes: number;
  collections: number;
  items: number;
  tags: number;
  verificationTokens: number;
};

type DatabaseInfo = {
  host: string;
  name: string;
};

type DeleteNonDemoUsersReportInput = {
  plan: DeleteNonDemoUsersPlan;
  counts: DeleteNonDemoUsersCounts;
  database: DatabaseInfo;
  mode: "dry-run" | "run";
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function displayUser(user: UserCandidate) {
  const name = user.name ?? "Unnamed";
  const email = user.email ?? "no email";

  return `${name} <${email}>`;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).toSorted((first, second) =>
    first.localeCompare(second),
  );
}

export function planNonDemoUserDeletion({
  users,
  verificationTokenIdentifiers,
  keepEmail = defaultDemoUserEmail,
}: {
  users: UserCandidate[];
  verificationTokenIdentifiers: string[];
  keepEmail?: string;
}): DeleteNonDemoUsersPlan {
  const normalizedKeepEmail = normalizeEmail(keepEmail);
  const keepUsers = users.filter(
    (user) => user.email && normalizeEmail(user.email) === normalizedKeepEmail,
  );

  if (keepUsers.length === 0) {
    throw new Error(`Demo user ${keepEmail} was not found. Refusing to delete users.`);
  }

  if (keepUsers.length > 1) {
    throw new Error(`Multiple users matched ${keepEmail}. Refusing to delete users.`);
  }

  const keepUser = keepUsers[0];
  const usersToDelete = users.filter((user) => user.id !== keepUser.id);
  const verificationTokenIdentifiersToDelete = uniqueSorted(
    verificationTokenIdentifiers.filter(
      (identifier) => normalizeEmail(identifier) !== normalizedKeepEmail,
    ),
  );

  return {
    keepEmail,
    keepUser,
    usersToDelete,
    verificationTokenIdentifiersToDelete,
  };
}

function formatCounts(counts: DeleteNonDemoUsersCounts) {
  return [
    `Users: ${counts.users}`,
    `Accounts: ${counts.accounts}`,
    `Sessions: ${counts.sessions}`,
    `User Item Types: ${counts.itemTypes}`,
    `Collections: ${counts.collections}`,
    `Items: ${counts.items}`,
    `Tags: ${counts.tags}`,
    `Verification Tokens: ${counts.verificationTokens}`,
  ].join("\n");
}

export function formatDeleteNonDemoUsersReport({
  plan,
  counts,
  database,
  mode,
}: DeleteNonDemoUsersReportInput) {
  const usersToDelete =
    plan.usersToDelete.length > 0
      ? plan.usersToDelete.map((user) => `- ${displayUser(user)} (${user.id})`)
      : ["- None"];
  const dryRunMessage =
    mode === "dry-run"
      ? [
          "",
          `No records were deleted. To execute, rerun with \`--run\` and \`CONFIRM_DELETE_NON_DEMO_USERS=${plan.keepEmail}\`.`,
        ]
      : [];

  return [
    "Delete Non-Demo Users",
    `Mode: ${mode}`,
    `Database: ${database.name} at ${database.host}`,
    `Keeping: ${displayUser(plan.keepUser)} (${plan.keepUser.id})`,
    "",
    "Users selected for deletion",
    ...usersToDelete,
    "",
    "Records selected for deletion",
    formatCounts(counts),
    ...dryRunMessage,
  ].join("\n");
}

function getConnectionString() {
  return process.env.DATABASE_URL ?? process.env.DIRECT_URL;
}

function createPrismaClient(connectionString: string) {
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

  return {
    database: {
      host: databaseUrl.host,
      name: databaseUrl.pathname.slice(1),
    },
    prisma: new PrismaClient({ adapter }),
  };
}

async function buildPlanFromDatabase(
  prisma: PrismaClient,
  keepEmail = defaultDemoUserEmail,
) {
  const [users, verificationTokens] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    prisma.verificationToken.findMany({
      distinct: ["identifier"],
      select: {
        identifier: true,
      },
    }),
  ]);

  return planNonDemoUserDeletion({
    users,
    verificationTokenIdentifiers: verificationTokens.map((token) => token.identifier),
    keepEmail,
  });
}

async function countByUserIds(
  userIds: string[],
  count: (userIds: string[]) => Promise<number>,
) {
  return userIds.length > 0 ? count(userIds) : 0;
}

async function countByIdentifiers(
  identifiers: string[],
  count: (identifiers: string[]) => Promise<number>,
) {
  return identifiers.length > 0 ? count(identifiers) : 0;
}

async function countRecordsSelectedForDeletion(
  prisma: PrismaClient,
  plan: DeleteNonDemoUsersPlan,
): Promise<DeleteNonDemoUsersCounts> {
  const userIds = plan.usersToDelete.map((user) => user.id);
  const verificationTokenIdentifiers = plan.verificationTokenIdentifiersToDelete;

  const [
    accounts,
    sessions,
    itemTypes,
    collections,
    items,
    tags,
    verificationTokens,
  ] = await Promise.all([
    countByUserIds(userIds, (ids) =>
      prisma.account.count({ where: { userId: { in: ids } } }),
    ),
    countByUserIds(userIds, (ids) =>
      prisma.session.count({ where: { userId: { in: ids } } }),
    ),
    countByUserIds(userIds, (ids) =>
      prisma.itemType.count({ where: { userId: { in: ids } } }),
    ),
    countByUserIds(userIds, (ids) =>
      prisma.collection.count({ where: { userId: { in: ids } } }),
    ),
    countByUserIds(userIds, (ids) =>
      prisma.item.count({ where: { userId: { in: ids } } }),
    ),
    countByUserIds(userIds, (ids) =>
      prisma.tag.count({ where: { userId: { in: ids } } }),
    ),
    countByIdentifiers(verificationTokenIdentifiers, (identifiers) =>
      prisma.verificationToken.count({
        where: {
          identifier: {
            in: identifiers,
          },
        },
      }),
    ),
  ]);

  return {
    users: userIds.length,
    accounts,
    sessions,
    itemTypes,
    collections,
    items,
    tags,
    verificationTokens,
  };
}

async function deleteSelectedRecords(prisma: PrismaClient, plan: DeleteNonDemoUsersPlan) {
  const userIds = plan.usersToDelete.map((user) => user.id);
  const verificationTokenIdentifiers = plan.verificationTokenIdentifiersToDelete;

  if (userIds.length === 0 && verificationTokenIdentifiers.length === 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (verificationTokenIdentifiers.length > 0) {
      await tx.verificationToken.deleteMany({
        where: {
          identifier: {
            in: verificationTokenIdentifiers,
          },
        },
      });
    }

    if (userIds.length > 0) {
      await tx.user.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });
    }
  });
}

function getKeepEmailFromArgs(args: string[]) {
  const keepEmailArg = args.find((arg) => arg.startsWith("--keep-email="));

  return keepEmailArg?.slice("--keep-email=".length) || defaultDemoUserEmail;
}

function assertExecutionConfirmed(keepEmail: string) {
  const confirmation = process.env.CONFIRM_DELETE_NON_DEMO_USERS;

  if (confirmation !== keepEmail) {
    throw new Error(
      `Set CONFIRM_DELETE_NON_DEMO_USERS=${keepEmail} to execute deletion.`,
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes("--run") ? "run" : "dry-run";
  const keepEmail = getKeepEmailFromArgs(args);
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is required.");
  }

  const { database, prisma } = createPrismaClient(connectionString);

  try {
    const plan = await buildPlanFromDatabase(prisma, keepEmail);
    const counts = await countRecordsSelectedForDeletion(prisma, plan);

    console.log(
      formatDeleteNonDemoUsersReport({
        plan,
        counts,
        database,
        mode,
      }),
    );

    if (mode === "dry-run") {
      return;
    }

    assertExecutionConfirmed(keepEmail);
    await deleteSelectedRecords(prisma, plan);
    console.log("\nDeletion complete.");
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
