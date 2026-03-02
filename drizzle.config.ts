import { defineConfig } from "drizzle-kit";

const databaseUrl =
  Bun.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/hono_ecommerce";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl
  },
  verbose: true,
  strict: true
});
