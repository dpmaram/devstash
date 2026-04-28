import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "next/server": fileURLToPath(new URL("./node_modules/next/server.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/*.test.tsx",
      "src/auth-pages.test.ts",
    ],
    include: [
      "prisma/**/*.test.ts",
      "scripts/**/*.test.ts",
      "src/actions/**/*.test.ts",
      "src/*route*.test.ts",
      "src/auth.config.test.ts",
      "src/components/auth/user-avatar.test.ts",
      "src/components/dashboard/accent-border-style.test.ts",
      "src/components/dashboard/sidebar-pro-badge.test.ts",
      "src/lib/**/*.test.ts",
      "src/proxy.test.ts",
    ],
    server: {
      deps: {
        inline: ["next-auth"],
      },
    },
  },
});
