import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createApp } from "../../src/app";
import { db } from "../../src/db/client";
import { orders } from "../../src/db/schema";

function expectIsoTimestamp(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

describe("orders list/detail routes", () => {
  const app = createApp();

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await db.delete(orders);
  });

  it("lists orders with status/date filters and pagination metadata", async () => {
    const [januaryPending, januaryShipped, februaryPending] = await db
      .insert(orders)
      .values([
        {
          status: "pending",
          customerId: 1001,
          items: [{ productId: 11, quantity: 1, unitPrice: 149.99 }],
          totalAmount: 149.99,
          createdAt: new Date("2025-01-10T09:00:00.000Z"),
          updatedAt: new Date("2025-01-10T09:00:00.000Z")
        },
        {
          status: "shipped",
          customerId: 1002,
          items: [{ productId: 12, quantity: 2, unitPrice: 49.5 }],
          totalAmount: 99,
          createdAt: new Date("2025-01-15T12:00:00.000Z"),
          updatedAt: new Date("2025-01-15T12:00:00.000Z")
        },
        {
          status: "pending",
          customerId: 1003,
          items: [{ productId: 13, quantity: 1, unitPrice: 299 }],
          totalAmount: 299,
          createdAt: new Date("2025-02-05T08:30:00.000Z"),
          updatedAt: new Date("2025-02-05T08:30:00.000Z")
        }
      ])
      .returning();

    const response = await app.request(
      "/v1/orders?status=pending&from=2025-01-01T00:00:00.000Z&to=2025-01-31T23:59:59.999Z&page=1&limit=2"
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 1,
      totalPages: 1
    });
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      id: januaryPending.id,
      status: "pending",
      customerId: 1001,
      items: [{ productId: 11, quantity: 1, unitPrice: 149.99 }],
      totalAmount: 149.99
    });
    expectIsoTimestamp(body.items[0].createdAt);
    expectIsoTimestamp(body.items[0].updatedAt);

    expect(januaryShipped.id).toBeGreaterThan(januaryPending.id);
    expect(februaryPending.id).toBeGreaterThan(januaryShipped.id);
  });

  it("returns 404 for missing order detail", async () => {
    const response = await app.request("/v1/orders/999999");

    expect(response.status).toBe(404);
    const body = await response.json();
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe("/v1/orders/999999");
    expect(body.error).toEqual({
      code: "NOT_FOUND",
      message: "Order not found"
    });
  });

  it("returns 400 envelope for invalid date filters", async () => {
    const response = await app.request("/v1/orders?from=not-a-date");

    expect(response.status).toBe(400);
    const body = await response.json();
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe("/v1/orders");
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Request validation failed");
    expect(body.error.details).toEqual([
      {
        field: "from",
        constraints: ["from must be a valid date"]
      }
    ]);
  });
});
