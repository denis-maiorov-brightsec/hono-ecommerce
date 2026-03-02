import { describe, expect, it } from "bun:test";

import { createApp } from "../../src/app";

describe("scaffold smoke", () => {
  const app = createApp();

  it("returns deprecated root payload", async () => {
    const response = await app.request("/");

    expect(response.status).toBe(200);
    expect(response.headers.get("deprecation")).toBe("true");
    expect(await response.json()).toEqual({
      message: "This unversioned root route is deprecated. Migrate to /v1/health."
    });
  });

  it("returns versioned health payload", async () => {
    const response = await app.request("/v1/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("does not expose unversioned health route", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(404);
  });
});
