import { prisma } from "@/lib/prisma";

export type DashboardUser = {
  id: string;
};

export type DashboardUserOptions = {
  user?: DashboardUser | null;
  userEmail?: string;
};

type SessionDashboardUser = {
  id?: string | null;
};

type DashboardUserForSessionDeps = {
  getFallbackDashboardUser: () => Promise<DashboardUser | null>;
  hasDashboardItems: (userId: string) => Promise<boolean>;
};

const defaultDashboardUserEmail = "demo@devstash.io";

function getDashboardUserEmail(userEmail?: string) {
  return userEmail ?? process.env.DEVSTASH_DASHBOARD_USER_EMAIL ?? defaultDashboardUserEmail;
}

export async function getDashboardUser(
  userEmail?: string,
): Promise<DashboardUser | null> {
  const email = getDashboardUserEmail(userEmail);
  const userByEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (userByEmail) {
    return userByEmail;
  }

  return prisma.user.findFirst({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
}

export async function resolveDashboardUser(
  options: DashboardUserOptions = {},
): Promise<DashboardUser | null> {
  if (options.user !== undefined) {
    return options.user;
  }

  return getDashboardUser(options.userEmail);
}

async function hasDashboardItems(userId: string) {
  const itemCount = await prisma.item.count({
    where: {
      userId,
    },
  });

  return itemCount > 0;
}

export async function getDashboardUserForSession(
  sessionUser?: SessionDashboardUser | null,
  deps: DashboardUserForSessionDeps = {
    getFallbackDashboardUser: () => getDashboardUser(),
    hasDashboardItems,
  },
): Promise<DashboardUser | null> {
  if (sessionUser?.id && await deps.hasDashboardItems(sessionUser.id)) {
    return {
      id: sessionUser.id,
    };
  }

  return deps.getFallbackDashboardUser();
}
