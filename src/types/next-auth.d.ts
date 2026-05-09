import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      planTier?: "FREE" | "PRO";
      isPro?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    planTier?: "FREE" | "PRO";
    isPro?: boolean;
  }
}
