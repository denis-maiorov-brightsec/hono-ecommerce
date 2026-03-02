import type { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import pino, { type Logger } from "pino";

import { ApiError } from "../errors";

export const REQUEST_ID_HEADER = "x-request-id";
const REQUEST_ID_CONTEXT_KEY = "request:id";
const REQUEST_COMPLETED_EVENT = "request.completed";

export type RequestObservabilityOptions = {
  logger?: Pick<Logger, "info">;
};

const defaultLogger = pino();

function resolveRequestId(c: Context): string {
  const incomingRequestId = c.req.header(REQUEST_ID_HEADER)?.trim();
  if (incomingRequestId) {
    return incomingRequestId;
  }

  return crypto.randomUUID();
}

function resolveErrorStatus(error: unknown): number {
  if (error instanceof ApiError) {
    return error.status;
  }

  if (error instanceof HTTPException) {
    return error.status;
  }

  return 500;
}

export function getRequestId(c: Context): string | undefined {
  return c.get(REQUEST_ID_CONTEXT_KEY) as string | undefined;
}

export function createRequestObservabilityMiddleware(
  options: RequestObservabilityOptions = {}
): MiddlewareHandler {
  const logger = options.logger ?? defaultLogger;

  return async (c, next) => {
    const requestId = resolveRequestId(c);
    c.set(REQUEST_ID_CONTEXT_KEY, requestId);
    c.header(REQUEST_ID_HEADER, requestId);

    const startedAt = Date.now();
    let status = 500;

    try {
      await next();
      status = c.res.status;
    } catch (error) {
      status = resolveErrorStatus(error);
      throw error;
    } finally {
      c.header(REQUEST_ID_HEADER, requestId);

      logger.info({
        event: REQUEST_COMPLETED_EVENT,
        requestId,
        method: c.req.method,
        path: c.req.path,
        status,
        latencyMs: Date.now() - startedAt
      });
    }
  };
}
