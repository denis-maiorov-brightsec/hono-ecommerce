import { config } from "dotenv";

config();

const DEFAULT_PORT = 3000;

function parsePort(raw: string | undefined): number {
  if (!raw) {
    return DEFAULT_PORT;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? DEFAULT_PORT : parsed;
}

export const env = {
  PORT: parsePort(Bun.env.PORT),
  DATABASE_URL:
    Bun.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/hono_ecommerce"
} as const;
