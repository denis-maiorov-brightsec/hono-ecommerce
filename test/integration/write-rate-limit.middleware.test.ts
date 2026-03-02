import { describe, expect, it } from "bun:test";

import { createApp } from "../../src/app";

function expectIsoTimestamp(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

function buildInvalidCreateProductRequest(clientIp: string): RequestInit {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": clientIp
    },
    body: JSON.stringify({})
  };
}

describe("write-route rate limiting middleware", () => {
  it("returns 429 with the standard error envelope when the write threshold is exceeded", async () => {
    const app = createApp({
      writeRateLimit: {
        maxRequests: 2,
        windowMs: 60_000
      }
    });

    const clientIp = "203.0.113.10";

    const firstResponse = await app.request(
      "/v1/products",
      buildInvalidCreateProductRequest(clientIp)
    );
    expect(firstResponse.status).toBe(400);

    const secondResponse = await app.request(
      "/v1/products",
      buildInvalidCreateProductRequest(clientIp)
    );
    expect(secondResponse.status).toBe(400);

    const throttledResponse = await app.request(
      "/v1/products",
      buildInvalidCreateProductRequest(clientIp)
    );

    expect(throttledResponse.status).toBe(429);
    const throttledBody = await throttledResponse.json();
    expectIsoTimestamp(throttledBody.timestamp);
    expect(throttledBody.path).toBe("/v1/products");
    expect(throttledBody.error).toEqual({
      code: "RATE_LIMIT_EXCEEDED",
      message: "Rate limit exceeded"
    });
  });

  it("does not throttle read-only routes", async () => {
    const app = createApp({
      writeRateLimit: {
        maxRequests: 1,
        windowMs: 60_000
      }
    });

    const clientIp = "198.51.100.8";

    const firstWriteResponse = await app.request(
      "/v1/products",
      buildInvalidCreateProductRequest(clientIp)
    );
    expect(firstWriteResponse.status).toBe(400);

    const throttledWriteResponse = await app.request(
      "/v1/products",
      buildInvalidCreateProductRequest(clientIp)
    );
    expect(throttledWriteResponse.status).toBe(429);

    const readResponse = await app.request("/v1/health", {
      headers: {
        "x-forwarded-for": clientIp
      }
    });
    expect(readResponse.status).toBe(200);
    expect(await readResponse.json()).toEqual({
      status: "ok"
    });
  });
});
