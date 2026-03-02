import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createApp } from "../../src/app";
import { AUTH_TEST_TOKENS } from "../../src/common/middleware/auth-stub";
import { db } from "../../src/db/client";
import { promotions } from "../../src/db/schema";

function expectIsoTimestamp(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

const PROMOTIONS_MANAGER_BEARER = `Bearer ${AUTH_TEST_TOKENS.PROMOTIONS_MANAGER}`;

async function requestPromotions(
  app: ReturnType<typeof createApp>,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("authorization", PROMOTIONS_MANAGER_BEARER);

  return app.request(path, {
    ...init,
    headers
  });
}

async function createPromotion(
  app: ReturnType<typeof createApp>,
  payload: {
    name: string;
    code: string;
    discountType: string;
    discountValue: number;
    status: string;
    startsAt?: string | null;
    endsAt?: string | null;
  }
): Promise<{ id: number }> {
  const response = await requestPromotions(app, "/v1/promotions", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  expect(response.status).toBe(201);
  return response.json();
}

describe("promotions CRUD routes", () => {
  const app = createApp();

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await db.delete(promotions);
  });

  it("supports create, list, get, patch, and delete flow", async () => {
    const createResponse = await requestPromotions(app, "/v1/promotions", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Spring Sale",
        code: "SPRING-15",
        discountType: "percentage",
        discountValue: 15,
        startsAt: "2025-03-01T00:00:00.000Z",
        endsAt: "2025-03-31T23:59:59.999Z",
        status: "active"
      })
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      name: "Spring Sale",
      code: "SPRING-15",
      discountType: "percentage",
      discountValue: 15,
      startsAt: "2025-03-01T00:00:00.000Z",
      endsAt: "2025-03-31T23:59:59.999Z",
      status: "active"
    });
    expect(typeof created.id).toBe("number");
    expectIsoTimestamp(created.createdAt);
    expectIsoTimestamp(created.updatedAt);

    const listResponse = await requestPromotions(app, "/v1/promotions");
    expect(listResponse.status).toBe(200);
    const listed = await listResponse.json();
    expect(Array.isArray(listed)).toBe(true);
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      id: created.id,
      name: "Spring Sale",
      code: "SPRING-15",
      discountType: "percentage",
      discountValue: 15,
      startsAt: "2025-03-01T00:00:00.000Z",
      endsAt: "2025-03-31T23:59:59.999Z",
      status: "active"
    });

    const getResponse = await requestPromotions(app, `/v1/promotions/${created.id}`);
    expect(getResponse.status).toBe(200);
    const fetched = await getResponse.json();
    expect(fetched).toMatchObject({
      id: created.id,
      name: "Spring Sale",
      code: "SPRING-15",
      discountType: "percentage",
      discountValue: 15,
      startsAt: "2025-03-01T00:00:00.000Z",
      endsAt: "2025-03-31T23:59:59.999Z",
      status: "active"
    });

    const patchResponse = await requestPromotions(
      app,
      `/v1/promotions/${created.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          discountValue: 20,
          status: "scheduled"
        })
      }
    );

    expect(patchResponse.status).toBe(200);
    const patched = await patchResponse.json();
    expect(patched).toMatchObject({
      id: created.id,
      name: "Spring Sale",
      code: "SPRING-15",
      discountType: "percentage",
      discountValue: 20,
      startsAt: "2025-03-01T00:00:00.000Z",
      endsAt: "2025-03-31T23:59:59.999Z",
      status: "scheduled"
    });

    const deleteResponse = await requestPromotions(app, `/v1/promotions/${created.id}`, {
      method: "DELETE"
    });
    expect(deleteResponse.status).toBe(204);
    expect(await deleteResponse.text()).toBe("");

    const getMissingResponse = await requestPromotions(
      app,
      `/v1/promotions/${created.id}`
    );
    expect(getMissingResponse.status).toBe(404);
    const getMissingBody = await getMissingResponse.json();
    expectIsoTimestamp(getMissingBody.timestamp);
    expect(getMissingBody.path).toBe(`/v1/promotions/${created.id}`);
    expect(getMissingBody.error).toEqual({
      code: "NOT_FOUND",
      message: "Promotion not found"
    });
  });

  it("returns 409 when creating duplicate promotion code", async () => {
    const firstResponse = await requestPromotions(app, "/v1/promotions", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Holiday Sale",
        code: "HOLIDAY-10",
        discountType: "percentage",
        discountValue: 10,
        status: "active"
      })
    });

    expect(firstResponse.status).toBe(201);

    const duplicateResponse = await requestPromotions(app, "/v1/promotions", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Holiday Sale B",
        code: "HOLIDAY-10",
        discountType: "percentage",
        discountValue: 12,
        status: "active"
      })
    });

    expect(duplicateResponse.status).toBe(409);
    const duplicateBody = await duplicateResponse.json();
    expectIsoTimestamp(duplicateBody.timestamp);
    expect(duplicateBody.path).toBe("/v1/promotions");
    expect(duplicateBody.error).toEqual({
      code: "CONFLICT",
      message: "Promotion code already exists"
    });
  });

  it("returns 400 for invalid date windows on create and patch", async () => {
    const invalidCreateResponse = await requestPromotions(app, "/v1/promotions", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Invalid Window",
        code: "INVALID-WINDOW",
        discountType: "percentage",
        discountValue: 5,
        startsAt: "2025-04-02T00:00:00.000Z",
        endsAt: "2025-04-01T00:00:00.000Z",
        status: "draft"
      })
    });

    expect(invalidCreateResponse.status).toBe(400);
    const invalidCreateBody = await invalidCreateResponse.json();
    expectIsoTimestamp(invalidCreateBody.timestamp);
    expect(invalidCreateBody.path).toBe("/v1/promotions");
    expect(invalidCreateBody.error.code).toBe("VALIDATION_ERROR");
    expect(invalidCreateBody.error.message).toBe("Request validation failed");
    expect(invalidCreateBody.error.details).toEqual([
      {
        field: "startsAt",
        constraints: ["startsAt must be less than or equal to endsAt"]
      }
    ]);

    const created = await createPromotion(app, {
      name: "Patch Date Window",
      code: "PATCH-WINDOW",
      discountType: "percentage",
      discountValue: 8,
      startsAt: "2025-04-01T00:00:00.000Z",
      endsAt: "2025-04-30T00:00:00.000Z",
      status: "active"
    });

    const invalidPatchResponse = await requestPromotions(
      app,
      `/v1/promotions/${created.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          startsAt: "2025-05-01T00:00:00.000Z"
        })
      }
    );

    expect(invalidPatchResponse.status).toBe(400);
    const invalidPatchBody = await invalidPatchResponse.json();
    expectIsoTimestamp(invalidPatchBody.timestamp);
    expect(invalidPatchBody.path).toBe(`/v1/promotions/${created.id}`);
    expect(invalidPatchBody.error.code).toBe("VALIDATION_ERROR");
    expect(invalidPatchBody.error.message).toBe("Request validation failed");
    expect(invalidPatchBody.error.details).toEqual([
      {
        field: "startsAt",
        constraints: ["startsAt must be less than or equal to endsAt"]
      }
    ]);
  });

  it("returns 404 when deleting a missing promotion", async () => {
    const response = await requestPromotions(app, "/v1/promotions/999999", {
      method: "DELETE"
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe("/v1/promotions/999999");
    expect(body.error).toEqual({
      code: "NOT_FOUND",
      message: "Promotion not found"
    });
  });
});
