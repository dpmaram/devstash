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
  findDashboardUserById?: (userId: string) => Promise<DashboardUser | null>;
  getFallbackDashboardUser: () => Promise<DashboardUser | null>;
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

export async function getDashboardUserForSession(
  sessionUser?: SessionDashboardUser | null,
  deps: DashboardUserForSessionDeps = {
    findDashboardUserById: (userId) =>
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      }),
    getFallbackDashboardUser: () => getDashboardUser(),
  },
): Promise<DashboardUser | null> {
  if (sessionUser?.id) {
    if (!deps.findDashboardUserById) {
      return {
        id: sessionUser.id,
      };
    }

    const dashboardUser = await deps.findDashboardUserById(sessionUser.id);

    if (dashboardUser) {
      return dashboardUser;
    }
  }

  return deps.getFallbackDashboardUser();
}
