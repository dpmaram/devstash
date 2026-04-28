import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import authConfig, { credentialsProviderFields } from "@/auth.config";
import { authorizeCredentials } from "@/lib/auth/credentials";
import { authCallbacks } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const prismaAdapterClient = prisma as unknown as Parameters<typeof PrismaAdapter>[0];
const authProviders = authConfig.providers.map((provider) => {
  if (provider.id !== "credentials") {
    return provider;
  }

  return Credentials({
    credentials: credentialsProviderFields,
    authorize: (credentials, request) =>
      authorizeCredentials(credentials, undefined, { request }),
  });
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prismaAdapterClient),
  callbacks: authCallbacks,
  providers: authProviders,
  session: {
    strategy: "jwt",
  },
});
