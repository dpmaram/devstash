import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

export function shouldAllowGitHubEmailAccountLinking(
  nodeEnv = process.env.NODE_ENV,
) {
  return nodeEnv === "development";
}

const authConfig = {
  providers: [
    GitHub({
      allowDangerousEmailAccountLinking: shouldAllowGitHubEmailAccountLinking(),
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;
