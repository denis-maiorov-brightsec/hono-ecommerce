import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { z } from "zod";

import { createApp } from "../../src/app";
import { db } from "../../src/db/client";
import { products } from "../../src/db/schema";

const isoTimestampSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  {
    message: "must be an ISO timestamp"
  }
);

const productSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string(),
    stockKeepingUnit: z.string(),
    price: z.number(),
    status: z.string(),
    categoryId: z.number().int().positive().nullable(),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema
  })
  .strict();

const paginatedProductsSchema = z
  .object({
    items: z.array(productSchema),
    pagination: z
      .object({
        page: z.number().int().positive(),
        limit: z.number().int().positive(),
        total: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative()
      })
      .strict()
  })
  .strict();

const validationDetailSchema = z
  .object({
    field: z.string(),
    constraints: z.array(z.string().min(1)).min(1)
  })
  .strict();

const errorEnvelopeSchema = z
  .object({
    timestamp: isoTimestampSchema,
    path: z.string(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.array(validationDetailSchema).optional()
      })
      .strict()
  })
  .strict();

async function parseJson<T>(
  response: Response,
  schema: z.ZodType<T>
): Promise<T> {
  return schema.parse(await response.json());
}

describe("products routes contract tests", () => {
  const app = createApp();

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await db.delete(products);
  });

  it("enforces response contracts for create, list, get, patch, delete, and search", async () => {
    const createResponse = await app.request("/v1/products", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Contract Keyboard",
        sku: "CNTR-KBD-001",
        price: 149.99,
        status: "active"
      })
    });

    expect(createResponse.status).toBe(201);
    const created = await parseJson(createResponse, productSchema);
    expect(created).toMatchObject({
      name: "Contract Keyboard",
      stockKeepingUnit: "CNTR-KBD-001",
      price: 149.99,
      status: "active",
      categoryId: null
    });
    expect("sku" in created).toBe(false);

    const listResponse = await app.request("/v1/products");
    expect(listResponse.status).toBe(200);
    const listed = await parseJson(listResponse, paginatedProductsSchema);
    expect(listed.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1
    });
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.id).toBe(created.id);
    expect(listed.items[0]?.stockKeepingUnit).toBe("CNTR-KBD-001");

    const getResponse = await app.request(`/v1/products/${created.id}`);
    expect(getResponse.status).toBe(200);
    const fetched = await parseJson(getResponse, productSchema);
    expect(fetched.id).toBe(created.id);
    expect(fetched.stockKeepingUnit).toBe("CNTR-KBD-001");

    const patchResponse = await app.request(`/v1/products/${created.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sku: "CNTR-KBD-002",
        status: "archived"
      })
    });

    expect(patchResponse.status).toBe(200);
    const patched = await parseJson(patchResponse, productSchema);
    expect(patched.id).toBe(created.id);
    expect(patched.stockKeepingUnit).toBe("CNTR-KBD-002");
    expect(patched.status).toBe("archived");
    expect("sku" in patched).toBe(false);

    const searchResponse = await app.request("/v1/search/products?q=KBD-002");
    expect(searchResponse.status).toBe(200);
    const searched = await parseJson(searchResponse, z.array(productSchema));
    expect(searched).toHaveLength(1);
    expect(searched[0]?.id).toBe(created.id);
    expect(searched[0]?.stockKeepingUnit).toBe("CNTR-KBD-002");
    expect("sku" in (searched[0] as object)).toBe(false);

    const deleteResponse = await app.request(`/v1/products/${created.id}`, {
      method: "DELETE"
    });
    expect(deleteResponse.status).toBe(204);
    expect(await deleteResponse.text()).toBe("");
  });

  it("enforces not-found contract for get, patch, and delete product routes", async () => {
    const missingId = 999999;

    const getResponse = await app.request(`/v1/products/${missingId}`);
    expect(getResponse.status).toBe(404);
    const getError = await parseJson(getResponse, errorEnvelopeSchema);
    expect(getError.path).toBe(`/v1/products/${missingId}`);
    expect(getError.error).toEqual({
      code: "NOT_FOUND",
      message: "Product not found"
    });

    const patchResponse = await app.request(`/v1/products/${missingId}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        status: "archived"
      })
    });
    expect(patchResponse.status).toBe(404);
    const patchError = await parseJson(patchResponse, errorEnvelopeSchema);
    expect(patchError.path).toBe(`/v1/products/${missingId}`);
    expect(patchError.error).toEqual({
      code: "NOT_FOUND",
      message: "Product not found"
    });

    const deleteResponse = await app.request(`/v1/products/${missingId}`, {
      method: "DELETE"
    });
    expect(deleteResponse.status).toBe(404);
    const deleteError = await parseJson(deleteResponse, errorEnvelopeSchema);
    expect(deleteError.path).toBe(`/v1/products/${missingId}`);
    expect(deleteError.error).toEqual({
      code: "NOT_FOUND",
      message: "Product not found"
    });
  });

  it("enforces validation error envelope contract for create and search", async () => {
    const invalidCreateResponse = await app.request("/v1/products", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Contract Mouse",
        stockKeepingUnit: "CNTR-MSE-001",
        price: 0,
        status: "active"
      })
    });

    expect(invalidCreateResponse.status).toBe(400);
    const createError = await parseJson(invalidCreateResponse, errorEnvelopeSchema);
    expect(createError.path).toBe("/v1/products");
    expect(createError.error.code).toBe("VALIDATION_ERROR");
    expect(createError.error.message).toBe("Request validation failed");
    expect(createError.error.details).toEqual([
      {
        field: "price",
        constraints: ["price must be greater than 0"]
      }
    ]);

    const invalidSearchResponse = await app.request("/v1/search/products");
    expect(invalidSearchResponse.status).toBe(400);
    const searchError = await parseJson(invalidSearchResponse, errorEnvelopeSchema);
    expect(searchError.path).toBe("/v1/search/products");
    expect(searchError.error.code).toBe("VALIDATION_ERROR");
    expect(searchError.error.message).toBe("Request validation failed");
    expect(searchError.error.details).toHaveLength(1);
    expect(searchError.error.details?.[0]?.field).toBe("q");
    expect(searchError.error.details?.[0]?.constraints.length).toBeGreaterThan(0);
  });
});
