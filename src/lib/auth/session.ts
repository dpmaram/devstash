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

export function attachSessionUserId({
  session,
  token,
}: AttachSessionUserIdParams): SessionWithOptionalUserId {
  if (session.user && token.sub) {
    session.user.id = token.sub;
  }

  return session;
}

export const authCallbacks = {
  session({ session, token }) {
    return attachSessionUserId({ session, token }) as Session;
  },
} satisfies NextAuthConfig["callbacks"];
