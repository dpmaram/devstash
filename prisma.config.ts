import "dotenv/config";
import { defineConfig } from "prisma/config";

const directUrl = process.env.DIRECT_URL;
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(directUrl
    ? {
        datasource: {
          url: directUrl,
          ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
        },
      }
    : {}),
});
