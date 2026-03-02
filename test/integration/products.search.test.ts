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
    sku: string;
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

describe("products search route", () => {
  const app = createApp();

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await db.delete(products);
  });

  it("searches across product name and sku with deterministic ordering", async () => {
    const keyboard = await createProduct(app, {
      name: "Keyboard Pro",
      sku: "KEY-001",
      price: 99.99,
      status: "active"
    });
    await createProduct(app, {
      name: "Gaming Mouse",
      sku: "MOU-002",
      price: 59.99,
      status: "active"
    });
    const stand = await createProduct(app, {
      name: "Laptop Stand",
      sku: "STAND-KEY-XL",
      price: 49.99,
      status: "active"
    });

    const response = await app.request("/v1/search/products?q=KeY");
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body.map((item: { id: number }) => item.id)).toEqual([
      keyboard.id,
      stand.id
    ]);
    expect(body[0]).toMatchObject({
      id: keyboard.id,
      name: "Keyboard Pro",
      sku: "KEY-001",
      price: 99.99,
      status: "active",
      categoryId: null
    });
    expect(body[1]).toMatchObject({
      id: stand.id,
      name: "Laptop Stand",
      sku: "STAND-KEY-XL",
      price: 49.99,
      status: "active",
      categoryId: null
    });
  });

  it("returns an empty array when no products match", async () => {
    await createProduct(app, {
      name: "Monitor",
      sku: "MON-001",
      price: 199.99,
      status: "active"
    });

    const response = await app.request("/v1/search/products?q=phone");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("returns 400 when q is missing", async () => {
    const response = await app.request("/v1/search/products");
    expect(response.status).toBe(400);

    const body = await response.json();
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe("/v1/search/products");
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Request validation failed");
    expect(body.error.details).toEqual([
      {
        field: "q",
        constraints: [expect.any(String)]
      }
    ]);
  });

  it("returns 400 when q is empty", async () => {
    const response = await app.request("/v1/search/products?q=%20%20");
    expect(response.status).toBe(400);

    const body = await response.json();
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe("/v1/search/products");
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Request validation failed");
    expect(body.error.details).toEqual([
      {
        field: "q",
        constraints: ["q must not be empty"]
      }
    ]);
  });
});
