import type { DefaultSession, NextAuthConfig, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

export type SessionPlanTier = "FREE" | "PRO";

type SessionWithOptionalUserId = Omit<Session, "user"> & {
  user?: DefaultSession["user"] & {
    id?: string;
    planTier?: SessionPlanTier;
    isPro?: boolean;
  };
};

type AttachSessionUserIdParams = {
  session: SessionWithOptionalUserId;
  token: JWT;
};

type SyncTokenBillingStateParams = {
  token: JWT;
  getUserBillingStateById?: (
    userId: string,
  ) => Promise<{ isPro: boolean; planTier: string } | null>;
};

async function getUserBillingStateByIdFromDb(userId: string) {
  const { getUserBillingState } = await import("@/lib/db/billing");

  return getUserBillingState(userId);
}

type ResolveAuthRedirectParams = {
  url: string;
  baseUrl: string;
};

export function attachSessionUserId({
  session,
  token,
}: AttachSessionUserIdParams): SessionWithOptionalUserId {
  if (session.user && token.sub) {
    session.user.id = token.sub;
    session.user.planTier = normalizeSessionPlanTier(token.planTier);
    session.user.isPro = Boolean(token.isPro);
  }

  return session;
}

export function normalizeSessionPlanTier(planTier: unknown): SessionPlanTier {
  if (typeof planTier !== "string") {
    return "FREE";
  }

  return planTier.trim().toUpperCase() === "PRO" ? "PRO" : "FREE";
}

export async function syncTokenBillingState({
  token,
  getUserBillingStateById = getUserBillingStateByIdFromDb,
}: SyncTokenBillingStateParams): Promise<JWT> {
  if (!token.sub) {
    return token;
  }

  const billingState = await getUserBillingStateById(token.sub);

  if (!billingState) {
    token.planTier = "FREE";
    token.isPro = false;

    return token;
  }

  token.planTier = normalizeSessionPlanTier(billingState.planTier);
  token.isPro = billingState.isPro;

  return token;
}

export function resolveAuthRedirect({
  url,
  baseUrl,
}: ResolveAuthRedirectParams) {
  if (url === baseUrl || url === `${baseUrl}/`) {
    return `${baseUrl}/dashboard`;
  }

  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }

  let redirectUrl: URL;

  try {
    redirectUrl = new URL(url);
  } catch {
    return baseUrl;
  }

  if (redirectUrl.origin === baseUrl) {
    return url;
  }

  return baseUrl;
}

export const authCallbacks = {
  async jwt({ token }) {
    return syncTokenBillingState({ token });
  },
  session({ session, token }) {
    return attachSessionUserId({ session, token }) as Session;
  },
  redirect({ url, baseUrl }) {
    return resolveAuthRedirect({ url, baseUrl });
  },
} satisfies NextAuthConfig["callbacks"];
