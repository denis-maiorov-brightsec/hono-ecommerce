import type { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { getRequestId, REQUEST_ID_HEADER } from "./request-observability";
import {
  ApiError,
  buildErrorEnvelope,
  buildInternalServerErrorEnvelope,
  INTERNAL_SERVER_ERROR_CODE,
  INTERNAL_SERVER_ERROR_MESSAGE,
  NOT_FOUND_ERROR_CODE,
  NOT_FOUND_MESSAGE
} from "../errors";

export function registerErrorEnvelope(app: Hono<any>): void {
  app.notFound((c) => {
    const requestId = getRequestId(c);
    if (requestId) {
      c.header(REQUEST_ID_HEADER, requestId);
    }

    return c.json(
      buildErrorEnvelope(c.req.path, NOT_FOUND_ERROR_CODE, NOT_FOUND_MESSAGE),
      404
    );
  });

  app.onError((error, c) => {
    const requestId = getRequestId(c);
    if (requestId) {
      c.header(REQUEST_ID_HEADER, requestId);
    }

    if (error instanceof ApiError) {
      return c.json(
        buildErrorEnvelope(c.req.path, error.code, error.message, error.details),
        error.status
      );
    }

    if (error instanceof HTTPException) {
      const status: ContentfulStatusCode = error.status;
      const code = status >= 500 ? INTERNAL_SERVER_ERROR_CODE : `HTTP_${status}`;
      const message =
        status >= 500 ? INTERNAL_SERVER_ERROR_MESSAGE : error.message;

      return c.json(buildErrorEnvelope(c.req.path, code, message), status);
    }

    return c.json(buildInternalServerErrorEnvelope(c.req.path), 500);
  });
}
