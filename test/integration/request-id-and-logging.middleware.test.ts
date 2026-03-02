import { describe, expect, it } from "bun:test";
import type { Logger } from "pino";

import { createApp } from "../../src/app";
import {
  getRequestId,
  REQUEST_ID_HEADER
} from "../../src/common/middleware/request-observability";

type RequestCompletedLog = {
  event: string;
  requestId: string;
  method: string;
  path: string;
  status: number;
  latencyMs: number;
};

describe("request id and structured logging middleware", () => {
  it("propagates incoming request id header", async () => {
    const app = createApp();
    const requestId = "external-request-id-123";

    const response = await app.request("/v1/health", {
      headers: {
        [REQUEST_ID_HEADER]: requestId
      }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get(REQUEST_ID_HEADER)).toBe(requestId);
  });

  it("generates request id when missing and exposes it in handlers", async () => {
    const app = createApp();

    app.get("/v1/request-id-probe", (c) => {
      return c.json({ requestId: getRequestId(c) });
    });

    const response = await app.request("/v1/request-id-probe");
    const body = await response.json();
    const responseRequestId = response.headers.get(REQUEST_ID_HEADER);

    expect(response.status).toBe(200);
    expect(typeof responseRequestId).toBe("string");
    expect((responseRequestId ?? "").length).toBeGreaterThan(0);
    expect(body).toEqual({ requestId: responseRequestId });
  });

  it("includes request id header in error responses", async () => {
    const app = createApp();

    const response = await app.request("/v1/products", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
    expect((response.headers.get(REQUEST_ID_HEADER) ?? "").length).toBeGreaterThan(0);
  });

  it("emits structured request completion logs", async () => {
    const logs: unknown[] = [];
    const logger: Pick<Logger, "info"> = {
      info(payload: unknown) {
        logs.push(payload);
      }
    } as Pick<Logger, "info">;

    const app = createApp({
      requestObservability: {
        logger
      }
    });

    const requestId = "request-log-probe";

    const response = await app.request("/v1/health", {
      headers: {
        [REQUEST_ID_HEADER]: requestId
      }
    });

    expect(response.status).toBe(200);
    expect(logs).toHaveLength(1);

    const log = logs[0] as RequestCompletedLog;
    expect(log.event).toBe("request.completed");
    expect(log.requestId).toBe(requestId);
    expect(log.method).toBe("GET");
    expect(log.path).toBe("/v1/health");
    expect(log.status).toBe(200);
    expect(typeof log.latencyMs).toBe("number");
    expect(log.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
