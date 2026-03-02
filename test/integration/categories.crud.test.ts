import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createApp } from "../../src/app";
import { db } from "../../src/db/client";
import { categories } from "../../src/db/schema";

function expectIsoTimestamp(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

describe("categories CRUD routes", () => {
  const app = createApp();

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await db.delete(categories);
  });

  it("supports create, list, get, patch, and delete flow", async () => {
    const createResponse = await app.request("/v1/categories", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Keyboards",
        slug: "keyboards",
        description: "Mechanical and membrane keyboards"
      })
    });

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      name: "Keyboards",
      slug: "keyboards",
      description: "Mechanical and membrane keyboards"
    });
    expect(typeof created.id).toBe("number");
    expectIsoTimestamp(created.createdAt);
    expectIsoTimestamp(created.updatedAt);

    const listResponse = await app.request("/v1/categories");
    expect(listResponse.status).toBe(200);
    const listed = await listResponse.json();
    expect(Array.isArray(listed)).toBe(true);
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      id: created.id,
      name: "Keyboards",
      slug: "keyboards",
      description: "Mechanical and membrane keyboards"
    });

    const getResponse = await app.request(`/v1/categories/${created.id}`);
    expect(getResponse.status).toBe(200);
    const fetched = await getResponse.json();
    expect(fetched).toMatchObject({
      id: created.id,
      name: "Keyboards",
      slug: "keyboards",
      description: "Mechanical and membrane keyboards"
    });

    const patchResponse = await app.request(`/v1/categories/${created.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Gaming Keyboards",
        description: "For performance-focused setups"
      })
    });

    expect(patchResponse.status).toBe(200);
    const patched = await patchResponse.json();
    expect(patched).toMatchObject({
      id: created.id,
      name: "Gaming Keyboards",
      slug: "keyboards",
      description: "For performance-focused setups"
    });

    const deleteResponse = await app.request(`/v1/categories/${created.id}`, {
      method: "DELETE"
    });
    expect(deleteResponse.status).toBe(204);
    expect(await deleteResponse.text()).toBe("");

    const getMissingResponse = await app.request(`/v1/categories/${created.id}`);
    expect(getMissingResponse.status).toBe(404);
    const getMissingBody = await getMissingResponse.json();
    expectIsoTimestamp(getMissingBody.timestamp);
    expect(getMissingBody.path).toBe(`/v1/categories/${created.id}`);
    expect(getMissingBody.error).toEqual({
      code: "NOT_FOUND",
      message: "Category not found"
    });
  });

  it("returns 409 when creating duplicate slug", async () => {
    const firstCreateResponse = await app.request("/v1/categories", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Mice",
        slug: "mice"
      })
    });

    expect(firstCreateResponse.status).toBe(201);

    const duplicateResponse = await app.request("/v1/categories", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Pointing Devices",
        slug: "mice"
      })
    });

    expect(duplicateResponse.status).toBe(409);
    const duplicateBody = await duplicateResponse.json();
    expectIsoTimestamp(duplicateBody.timestamp);
    expect(duplicateBody.path).toBe("/v1/categories");
    expect(duplicateBody.error).toEqual({
      code: "CONFLICT",
      message: "Category slug already exists"
    });
  });

  it("returns 404 for missing categories on get and delete", async () => {
    const getResponse = await app.request("/v1/categories/999999");
    expect(getResponse.status).toBe(404);
    const getBody = await getResponse.json();
    expectIsoTimestamp(getBody.timestamp);
    expect(getBody.path).toBe("/v1/categories/999999");
    expect(getBody.error).toEqual({
      code: "NOT_FOUND",
      message: "Category not found"
    });

    const deleteResponse = await app.request("/v1/categories/999999", {
      method: "DELETE"
    });
    expect(deleteResponse.status).toBe(404);
    const deleteBody = await deleteResponse.json();
    expectIsoTimestamp(deleteBody.timestamp);
    expect(deleteBody.path).toBe("/v1/categories/999999");
    expect(deleteBody.error).toEqual({
      code: "NOT_FOUND",
      message: "Category not found"
    });
  });
});
