import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import authConfig from "@/auth.config";
import { authCallbacks } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const prismaAdapterClient = prisma as unknown as Parameters<typeof PrismaAdapter>[0];

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prismaAdapterClient),
  callbacks: authCallbacks,
  session: {
    strategy: "jwt",
  },
});
