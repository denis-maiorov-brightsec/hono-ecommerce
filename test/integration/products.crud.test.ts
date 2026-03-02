import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createApp } from "../../src/app";
import { db } from "../../src/db/client";
import { products } from "../../src/db/schema";

function expectIsoTimestamp(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
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
        sku: "KEY-001",
        price: 99.99,
        status: "active",
        categoryId: 10
      })
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      name: "Keyboard",
      sku: "KEY-001",
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
    expect(Array.isArray(listed)).toBe(true);
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      id: created.id,
      name: "Keyboard",
      sku: "KEY-001",
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
      sku: "KEY-001",
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
      sku: "KEY-001",
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
        sku: "MOU-001",
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

  it("returns 400 when patch payload is empty", async () => {
    const createResponse = await app.request("/v1/products", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Display",
        sku: "DSP-001",
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
});
