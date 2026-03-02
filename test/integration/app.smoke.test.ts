import { describe, expect, it } from "bun:test";

import { createApp } from "../../src/app";

describe("scaffold smoke", () => {
  const app = createApp();

  it("returns baseline root payload", async () => {
    const response = await app.request("/");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      service: "hono-ecommerce",
      message: "unversioned routes are temporary and will move under /v1"
    });
  });

  it("returns baseline health payload", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
