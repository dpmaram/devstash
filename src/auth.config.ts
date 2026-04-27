import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

export function shouldAllowGitHubEmailAccountLinking(
  nodeEnv = process.env.NODE_ENV,
) {
  return nodeEnv === "development";
}

export const credentialsProviderFields = {
  email: {
    label: "Email",
    type: "email",
  },
  password: {
    label: "Password",
    type: "password",
  },
};

const authConfig = {
  providers: [
    GitHub({
      allowDangerousEmailAccountLinking: shouldAllowGitHubEmailAccountLinking(),
    }),
    Credentials({
      credentials: credentialsProviderFields,
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;
