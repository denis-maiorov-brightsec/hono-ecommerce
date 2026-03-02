import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createApp } from "../../src/app";
import { db } from "../../src/db/client";
import { products } from "../../src/db/schema";

function expectIsoTimestamp(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

async function createProduct(
  app: ReturnType<typeof createApp>,
  payload: {
    name: string;
    stockKeepingUnit?: string;
    sku?: string;
    price: number;
    status: string;
    categoryId?: number;
  }
): Promise<{ id: number }> {
  const response = await app.request("/v1/products", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  expect(response.status).toBe(201);
  return response.json();
}

describe("products CRUD routes", () => {
  const app = createApp();

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await db.delete(products);
  });

  it("supports create, list, get, patch, and delete flow", async () => {
    const createResponse = await app.request("/v1/products", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Keyboard",
        stockKeepingUnit: "KEY-001",
        price: 99.99,
        status: "active",
        categoryId: 10
      })
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      name: "Keyboard",
      stockKeepingUnit: "KEY-001",
      price: 99.99,
      status: "active",
      categoryId: 10
    });
    expect(typeof created.id).toBe("number");
    expectIsoTimestamp(created.createdAt);
    expectIsoTimestamp(created.updatedAt);

    const listResponse = await app.request("/v1/products");
    expect(listResponse.status).toBe(200);
    const listed = await listResponse.json();
    expect(listed.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1
    });
    expect(Array.isArray(listed.items)).toBe(true);
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]).toMatchObject({
      id: created.id,
      name: "Keyboard",
      stockKeepingUnit: "KEY-001",
      price: 99.99,
      status: "active",
      categoryId: 10
    });

    const getResponse = await app.request(`/v1/products/${created.id}`);
    expect(getResponse.status).toBe(200);
    const fetched = await getResponse.json();
    expect(fetched).toMatchObject({
      id: created.id,
      name: "Keyboard",
      stockKeepingUnit: "KEY-001",
      price: 99.99,
      status: "active",
      categoryId: 10
    });

    const patchResponse = await app.request(`/v1/products/${created.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        price: 89.5,
        status: "archived"
      })
    });

    expect(patchResponse.status).toBe(200);
    const patched = await patchResponse.json();
    expect(patched).toMatchObject({
      id: created.id,
      name: "Keyboard",
      stockKeepingUnit: "KEY-001",
      price: 89.5,
      status: "archived",
      categoryId: 10
    });

    const deleteResponse = await app.request(`/v1/products/${created.id}`, {
      method: "DELETE"
    });
    expect(deleteResponse.status).toBe(204);
    expect(await deleteResponse.text()).toBe("");

    const getMissingResponse = await app.request(`/v1/products/${created.id}`);
    expect(getMissingResponse.status).toBe(404);
    const getMissingBody = await getMissingResponse.json();
    expectIsoTimestamp(getMissingBody.timestamp);
    expect(getMissingBody.path).toBe(`/v1/products/${created.id}`);
    expect(getMissingBody.error).toEqual({
      code: "NOT_FOUND",
      message: "Product not found"
    });
  });

  it("returns 400 when create payload is invalid", async () => {
    const response = await app.request("/v1/products", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Mouse",
        stockKeepingUnit: "MOU-001",
        price: 0,
        status: "active"
      })
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe("/v1/products");
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Request validation failed");
    expect(body.error.details).toEqual([
      {
        field: "price",
        constraints: ["price must be greater than 0"]
      }
    ]);
  });

  it("returns 400 when neither stockKeepingUnit nor deprecated sku is provided", async () => {
    const response = await app.request("/v1/products", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Mouse",
        price: 10,
        status: "active"
      })
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.details).toEqual([
      {
        field: "stockKeepingUnit",
        constraints: ["stockKeepingUnit must not be empty"]
      }
    ]);
  });

  it("supports pagination defaults and page/limit query params", async () => {
    const first = await createProduct(app, {
      name: "Keyboard",
      stockKeepingUnit: "KEY-001",
      price: 99.99,
      status: "active"
    });
    const second = await createProduct(app, {
      name: "Mouse",
      stockKeepingUnit: "MOU-001",
      price: 39.99,
      status: "active"
    });
    const third = await createProduct(app, {
      name: "Display",
      stockKeepingUnit: "DSP-001",
      price: 229.99,
      status: "active"
    });

    const defaultListResponse = await app.request("/v1/products");
    expect(defaultListResponse.status).toBe(200);
    const defaultListed = await defaultListResponse.json();
    expect(defaultListed.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1
    });
    expect(defaultListed.items.map((product: { id: number }) => product.id)).toEqual([
      first.id,
      second.id,
      third.id
    ]);

    const pagedResponse = await app.request("/v1/products?page=2&limit=2");
    expect(pagedResponse.status).toBe(200);
    const pagedBody = await pagedResponse.json();
    expect(pagedBody.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2
    });
    expect(pagedBody.items).toHaveLength(1);
    expect(pagedBody.items[0]).toMatchObject({
      id: third.id,
      name: "Display",
      stockKeepingUnit: "DSP-001",
      price: 229.99,
      status: "active",
      categoryId: null
    });
  });

  it("returns 400 for invalid pagination query params", async () => {
    const invalidRequests = [
      {
        path: "/v1/products?page=0",
        field: "page",
        message: "page must be a positive integer"
      },
      {
        path: "/v1/products?limit=0",
        field: "limit",
        message: "limit must be a positive integer"
      },
      {
        path: "/v1/products?limit=101",
        field: "limit",
        message: "limit must be less than or equal to 100"
      }
    ];

    for (const request of invalidRequests) {
      const response = await app.request(request.path);
      expect(response.status).toBe(400);
      const body = await response.json();
      expectIsoTimestamp(body.timestamp);
      expect(body.path).toBe("/v1/products");
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("Request validation failed");
      expect(body.error.details).toEqual([
        {
          field: request.field,
          constraints: [request.message]
        }
      ]);
    }
  });

  it("returns 400 when patch payload is empty", async () => {
    const createResponse = await app.request("/v1/products", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Display",
        stockKeepingUnit: "DSP-001",
        price: 229.99,
        status: "active"
      })
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();

    const patchResponse = await app.request(`/v1/products/${created.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({})
    });

    expect(patchResponse.status).toBe(400);
    const patchBody = await patchResponse.json();
    expectIsoTimestamp(patchBody.timestamp);
    expect(patchBody.path).toBe(`/v1/products/${created.id}`);
    expect(patchBody.error.code).toBe("VALIDATION_ERROR");
    expect(patchBody.error.message).toBe("Request validation failed");
    expect(patchBody.error.details).toEqual([
      {
        field: "json",
        constraints: ["at least one field must be provided"]
      }
    ]);
  });

  it("returns 404 for missing products on get and delete", async () => {
    const getResponse = await app.request("/v1/products/999999");
    expect(getResponse.status).toBe(404);
    const getBody = await getResponse.json();
    expectIsoTimestamp(getBody.timestamp);
    expect(getBody.path).toBe("/v1/products/999999");
    expect(getBody.error).toEqual({
      code: "NOT_FOUND",
      message: "Product not found"
    });

    const deleteResponse = await app.request("/v1/products/999999", {
      method: "DELETE"
    });
    expect(deleteResponse.status).toBe(404);
    const deleteBody = await deleteResponse.json();
    expectIsoTimestamp(deleteBody.timestamp);
    expect(deleteBody.path).toBe("/v1/products/999999");
    expect(deleteBody.error).toEqual({
      code: "NOT_FOUND",
      message: "Product not found"
    });
  });

  it("accepts deprecated sku alias on create and patch while responding with stockKeepingUnit", async () => {
    const createResponse = await app.request("/v1/products", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Dock",
        sku: "DOCK-001",
        price: 119.99,
        status: "active"
      })
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      name: "Dock",
      stockKeepingUnit: "DOCK-001",
      price: 119.99,
      status: "active",
      categoryId: null
    });
    expect(created.sku).toBeUndefined();

    const patchResponse = await app.request(`/v1/products/${created.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sku: "DOCK-002"
      })
    });

    expect(patchResponse.status).toBe(200);
    const patched = await patchResponse.json();
    expect(patched.stockKeepingUnit).toBe("DOCK-002");
    expect(patched.sku).toBeUndefined();
  });

  it("returns 400 when stockKeepingUnit and deprecated sku conflict", async () => {
    const createConflictResponse = await app.request("/v1/products", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Cable",
        stockKeepingUnit: "CBL-001",
        sku: "CBL-002",
        price: 14.99,
        status: "active"
      })
    });

    expect(createConflictResponse.status).toBe(400);
    const createConflictBody = await createConflictResponse.json();
    expect(createConflictBody.error.details).toEqual([
      {
        field: "stockKeepingUnit",
        constraints: [
          "stockKeepingUnit and deprecated sku must match when both are provided"
        ]
      }
    ]);

    const created = await createProduct(app, {
      name: "Webcam",
      stockKeepingUnit: "CAM-001",
      price: 79.99,
      status: "active"
    });

    const patchConflictResponse = await app.request(`/v1/products/${created.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        stockKeepingUnit: "CAM-002",
        sku: "CAM-003"
      })
    });

    expect(patchConflictResponse.status).toBe(400);
    const patchConflictBody = await patchConflictResponse.json();
    expect(patchConflictBody.error.details).toEqual([
      {
        field: "stockKeepingUnit",
        constraints: [
          "stockKeepingUnit and deprecated sku must match when both are provided"
        ]
      }
    ]);
  });
});
