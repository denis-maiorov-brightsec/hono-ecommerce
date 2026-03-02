import { describe, expect, it } from "bun:test";

import { createApp } from "../../src/app";
import { AUTH_TEST_TOKENS } from "../../src/common/middleware/auth-stub";

function expectIsoTimestamp(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

describe("promotions auth protection", () => {
  const app = createApp();

  it("rejects unauthenticated requests for promotions endpoints", async () => {
    const requests: Array<{ path: string; init?: RequestInit }> = [
      {
        path: "/v1/promotions"
      },
      {
        path: "/v1/promotions/1"
      },
      {
        path: "/v1/promotions",
        init: {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            name: "Flash Sale",
            code: "FLASH-10",
            discountType: "percentage",
            discountValue: 10,
            status: "active"
          })
        }
      },
      {
        path: "/v1/promotions/1",
        init: {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            status: "archived"
          })
        }
      },
      {
        path: "/v1/promotions/1",
        init: {
          method: "DELETE"
        }
      }
    ];

    for (const request of requests) {
      const response = await app.request(request.path, request.init);
      expect(response.status).toBe(401);

      const body = await response.json();
      expectIsoTimestamp(body.timestamp);
      expect(body.path).toBe(request.path);
      expect(body.error).toEqual({
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication required"
      });
    }
  });

  it("returns 403 when authenticated user lacks required promotions role", async () => {
    const response = await app.request("/v1/promotions", {
      headers: {
        authorization: `Bearer ${AUTH_TEST_TOKENS.CATALOG_VIEWER}`
      }
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe("/v1/promotions");
    expect(body.error).toEqual({
      code: "FORBIDDEN",
      message: "Forbidden"
    });
  });

  it("keeps non-protected endpoints accessible without auth", async () => {
    const response = await app.request("/v1/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok"
    });
  });
});
