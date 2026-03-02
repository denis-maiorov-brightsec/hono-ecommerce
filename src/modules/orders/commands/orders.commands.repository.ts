import { and, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

import { db } from "../../../db/client";
import { orders } from "../../../db/schema";

export type OrderRecord = InferSelectModel<typeof orders>;

export class OrdersCommandsRepository {
  async findById(id: number): Promise<OrderRecord | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async cancelPendingById(id: number): Promise<OrderRecord | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        status: "cancelled",
        updatedAt: new Date()
      })
      .where(and(eq(orders.id, id), eq(orders.status, "pending")))
      .returning();

    return order;
  }
}
