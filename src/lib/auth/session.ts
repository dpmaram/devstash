import type { DefaultSession, NextAuthConfig, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

type SessionWithOptionalUserId = Omit<Session, "user"> & {
  user?: DefaultSession["user"] & {
    id?: string;
  };
};

type AttachSessionUserIdParams = {
  session: SessionWithOptionalUserId;
  token: JWT;
};

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
  }

  return session;
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
  session({ session, token }) {
    return attachSessionUserId({ session, token }) as Session;
  },
  redirect({ url, baseUrl }) {
    return resolveAuthRedirect({ url, baseUrl });
  },
} satisfies NextAuthConfig["callbacks"];
