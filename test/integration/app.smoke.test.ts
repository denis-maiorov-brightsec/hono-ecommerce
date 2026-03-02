import { describe, expect, it } from "bun:test";
import { z } from "zod";

import { createApp } from "../../src/app";
import {
  getValidatedData,
  validateRequest
} from "../../src/common/validation/request-validator";

function expectIsoTimestamp(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

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
    const body = await response.json();

    expect(response.status).toBe(404);
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe("/health");
    expect(body.error).toEqual({
      code: "NOT_FOUND",
      message: "Route not found"
    });
  });

  it("maps validation failures to the error envelope", async () => {
    const app = createApp();
    const createProbeSchema = z.object({
      name: z.string().min(1, "name must not be empty")
    });

    app.post(
      "/v1/validation-probe",
      validateRequest("json", createProbeSchema),
      (c) => {
        const payload = getValidatedData<z.infer<typeof createProbeSchema>>(
          c,
          "json"
        );

        return c.json(payload, 201);
      }
    );

    const response = await app.request("/v1/validation-probe", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ name: "" })
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe("/v1/validation-probe");
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Request validation failed");
    expect(body.error.details).toEqual([
      {
        field: "name",
        constraints: ["name must not be empty"]
      }
    ]);
  });

  it("sanitizes unknown runtime errors", async () => {
    const app = createApp();

    app.get("/v1/error-probe", () => {
      throw new Error("database connection password leaked");
    });

    const response = await app.request("/v1/error-probe");
    const body = await response.json();

    expect(response.status).toBe(500);
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe("/v1/error-probe");
    expect(body.error).toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error"
    });
  });
});
