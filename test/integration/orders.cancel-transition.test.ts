import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createApp } from "../../src/app";
import { db } from "../../src/db/client";
import { orders } from "../../src/db/schema";

function expectIsoTimestamp(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(Number.isNaN(Date.parse(value as string))).toBe(false);
}

describe("orders cancel route", () => {
  const app = createApp();

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
  });

  beforeEach(async () => {
    await db.delete(orders);
  });

  it("cancels pending order and returns updated record", async () => {
    const previousUpdatedAt = new Date("2025-01-10T09:00:00.000Z");

    const [pendingOrder] = await db
      .insert(orders)
      .values({
        status: "pending",
        customerId: 101,
        items: [{ productId: 1, quantity: 2, unitPrice: 20 }],
        totalAmount: 40,
        createdAt: new Date("2025-01-10T08:00:00.000Z"),
        updatedAt: previousUpdatedAt
      })
      .returning();

    const response = await app.request(`/v1/orders/${pendingOrder.id}/cancel`, {
      method: "POST"
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      id: pendingOrder.id,
      status: "cancelled",
      customerId: 101,
      items: [{ productId: 1, quantity: 2, unitPrice: 20 }],
      totalAmount: 40
    });
    expectIsoTimestamp(body.createdAt);
    expectIsoTimestamp(body.updatedAt);
    expect(Date.parse(body.updatedAt)).toBeGreaterThan(previousUpdatedAt.getTime());

    const [persistedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, pendingOrder.id));

    expect(persistedOrder?.status).toBe("cancelled");
    expect(persistedOrder?.updatedAt.getTime()).toBeGreaterThan(
      previousUpdatedAt.getTime()
    );
  });

  it("returns 404 for canceling a missing order", async () => {
    const response = await app.request("/v1/orders/999999/cancel", {
      method: "POST"
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe("/v1/orders/999999/cancel");
    expect(body.error).toEqual({
      code: "NOT_FOUND",
      message: "Order not found"
    });
  });

  it("returns 409 when order status is not pending", async () => {
    const [shippedOrder] = await db
      .insert(orders)
      .values({
        status: "shipped",
        customerId: 102,
        items: [{ productId: 2, quantity: 1, unitPrice: 99 }],
        totalAmount: 99,
        createdAt: new Date("2025-01-12T08:00:00.000Z"),
        updatedAt: new Date("2025-01-12T08:00:00.000Z")
      })
      .returning();

    const response = await app.request(`/v1/orders/${shippedOrder.id}/cancel`, {
      method: "POST"
    });

    expect(response.status).toBe(409);
    const body = await response.json();
    expectIsoTimestamp(body.timestamp);
    expect(body.path).toBe(`/v1/orders/${shippedOrder.id}/cancel`);
    expect(body.error).toEqual({
      code: "CONFLICT",
      message: "Only pending orders can be cancelled"
    });

    const [persistedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, shippedOrder.id));

    expect(persistedOrder?.status).toBe("shipped");
  });
});
