import type { Context, MiddlewareHandler } from "hono";

import { ApiError } from "../errors";
import { env } from "../../config/env";

const WRITE_METHODS = new Set(["POST", "PATCH", "DELETE"]);
const RATE_LIMIT_EXCEEDED_CODE = "RATE_LIMIT_EXCEEDED";
const RATE_LIMIT_EXCEEDED_MESSAGE = "Rate limit exceeded";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type WriteRateLimitOptions = {
  maxRequests?: number;
  windowMs?: number;
};

function resolveClientIdentifier(c: Context): string {
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    const firstForwarded = forwardedFor.split(",")[0]?.trim();
    if (firstForwarded) {
      return firstForwarded;
    }
  }

  const realIp = c.req.header("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const cloudflareIp = c.req.header("cf-connecting-ip")?.trim();
  if (cloudflareIp) {
    return cloudflareIp;
  }

  return "anonymous";
}

function resolvePositiveInt(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return fallback;
  }

  return value;
}

export function createWriteRateLimitMiddleware(
  options: WriteRateLimitOptions = {}
): MiddlewareHandler {
  const maxRequests = resolvePositiveInt(
    options.maxRequests,
    env.WRITE_RATE_LIMIT_MAX_REQUESTS
  );
  const windowMs = resolvePositiveInt(options.windowMs, env.WRITE_RATE_LIMIT_WINDOW_MS);
  const buckets = new Map<string, RateLimitBucket>();

  return async (c, next) => {
    if (!WRITE_METHODS.has(c.req.method)) {
      await next();
      return;
    }

    const clientIdentifier = resolveClientIdentifier(c);
    const now = Date.now();
    const bucket = buckets.get(clientIdentifier);

    if (!bucket || now >= bucket.resetAt) {
      buckets.set(clientIdentifier, {
        count: 1,
        resetAt: now + windowMs
      });
      await next();
      return;
    }

    if (bucket.count >= maxRequests) {
      throw new ApiError(
        429,
        RATE_LIMIT_EXCEEDED_CODE,
        RATE_LIMIT_EXCEEDED_MESSAGE
      );
    }

    bucket.count += 1;
    await next();
  };
}
