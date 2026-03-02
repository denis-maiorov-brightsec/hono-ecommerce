import { config } from "dotenv";

config();

const DEFAULT_PORT = 3000;
const DEFAULT_WRITE_RATE_LIMIT_MAX_REQUESTS = 100;
const DEFAULT_WRITE_RATE_LIMIT_WINDOW_MS = 60_000;

function parsePort(raw: string | undefined): number {
  if (!raw) {
    return DEFAULT_PORT;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? DEFAULT_PORT : parsed;
}

function parsePositiveInteger(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export const env = {
  PORT: parsePort(Bun.env.PORT),
  DATABASE_URL:
    Bun.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/hono_ecommerce",
  WRITE_RATE_LIMIT_MAX_REQUESTS: parsePositiveInteger(
    Bun.env.WRITE_RATE_LIMIT_MAX_REQUESTS,
    DEFAULT_WRITE_RATE_LIMIT_MAX_REQUESTS
  ),
  WRITE_RATE_LIMIT_WINDOW_MS: parsePositiveInteger(
    Bun.env.WRITE_RATE_LIMIT_WINDOW_MS,
    DEFAULT_WRITE_RATE_LIMIT_WINDOW_MS
  )
} as const;
