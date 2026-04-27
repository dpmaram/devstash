import { prisma } from "@/lib/prisma";

export type DashboardUser = {
  id: string;
};

export type DashboardUserOptions = {
  user?: DashboardUser | null;
  userEmail?: string;
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
