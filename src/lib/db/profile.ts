import { dashboardItemTypeSelect } from "./dashboard-query-shapes";

export type ProfileItemTypeRecord = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
};

export type ProfileItemCountRecord = {
  itemTypeId: string;
  _count: {
    _all: number;
  };
};

export type ProfileAccountRecord = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  passwordHash: string | null;
  accounts: {
    provider: string;
  }[];
};

export type ProfileAccountSummary = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  createdAtLabel: string;
  canChangePassword: boolean;
  authMethods: string[];
};

export type ProfileItemTypeBreakdown = Omit<ProfileItemTypeRecord, "name"> & {
  label: string;
  count: number;
};

export type ProfileStats = {
  totalItems: number;
  totalCollections: number;
  itemTypeBreakdown: ProfileItemTypeBreakdown[];
};

export type ProfileData = {
  user: ProfileAccountSummary;
  stats: ProfileStats;
};

const profileItemTypeOrder = [
  "snippet",
  "prompt",
  "note",
  "command",
  "link",
  "file",
  "image",
] as const;

const profileItemTypeRank = new Map<string, number>(
  profileItemTypeOrder.map((slug, index) => [slug, index]),
);

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function pluralize(value: string) {
  if (value.endsWith("s")) {
    return value;
  }

  if (value.endsWith("y")) {
    return `${value.slice(0, -1)}ies`;
  }

  return `${value}s`;
}

function formatAuthProvider(provider: string) {
  if (provider === "github") {
    return "GitHub";
  }

  return capitalize(provider);
}

function sortProfileItemTypes(itemTypes: ProfileItemTypeRecord[]) {
  return [...itemTypes].sort((firstItemType, secondItemType) => {
    const firstRank =
      profileItemTypeRank.get(firstItemType.slug) ?? Number.MAX_SAFE_INTEGER;
    const secondRank =
      profileItemTypeRank.get(secondItemType.slug) ?? Number.MAX_SAFE_INTEGER;
    const rankDifference = firstRank - secondRank;

    if (rankDifference !== 0) {
      return rankDifference;
    }

    return firstItemType.slug.localeCompare(secondItemType.slug);
  });
}

export function formatProfileCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(createdAt);
}

export function buildProfileStats({
  collectionCount,
  itemCounts,
  itemTypes,
}: {
  collectionCount: number;
  itemCounts: ProfileItemCountRecord[];
  itemTypes: ProfileItemTypeRecord[];
}): ProfileStats {
  const itemCountByTypeId = new Map(
    itemCounts.map((itemCount) => [itemCount.itemTypeId, itemCount._count._all]),
  );
  const itemTypeBreakdown = sortProfileItemTypes(itemTypes).map((itemType) => {
    const count = itemCountByTypeId.get(itemType.id) ?? 0;

    return {
      id: itemType.id,
      slug: itemType.slug,
      icon: itemType.icon,
      color: itemType.color,
      label: capitalize(pluralize(itemType.name)),
      count,
    };
  });

  return {
    totalItems: itemCounts.reduce(
      (total, itemCount) => total + itemCount._count._all,
      0,
    ),
    totalCollections: collectionCount,
    itemTypeBreakdown,
  };
}

export function toProfileAccountSummary(
  user: ProfileAccountRecord,
): ProfileAccountSummary {
  const authMethods = new Set<string>();

  if (user.passwordHash) {
    authMethods.add("Email");
  }

  for (const account of user.accounts) {
    authMethods.add(formatAuthProvider(account.provider));
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    createdAtLabel: formatProfileCreatedAt(user.createdAt),
    canChangePassword: Boolean(user.passwordHash),
    authMethods: [...authMethods],
  };
}

export async function getProfileData(userId: string): Promise<ProfileData | null> {
  const { prisma } = await import("../prisma");
  const [user, itemTypes, itemCounts, collectionCount] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        passwordHash: true,
        accounts: {
          orderBy: {
            provider: "asc",
          },
          select: {
            provider: true,
          },
        },
      },
    }),
    prisma.itemType.findMany({
      where: {
        isSystem: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: dashboardItemTypeSelect,
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: {
        userId,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.collection.count({
      where: {
        userId,
      },
    }),
  ]);

  if (!user) {
    return null;
  }

  return {
    user: toProfileAccountSummary(user),
    stats: buildProfileStats({
      collectionCount,
      itemCounts,
      itemTypes,
    }),
  };
}
