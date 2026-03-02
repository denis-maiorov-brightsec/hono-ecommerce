import { and, asc, count, eq, gte, lte } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

import { db } from "../../../db/client";
import { orders } from "../../../db/schema";

export type OrderRecord = InferSelectModel<typeof orders>;

export type ListOrdersFilters = {
  status?: string;
  from?: Date;
  to?: Date;
};

function buildListWhereClause(filters: ListOrdersFilters) {
  return and(
    filters.status ? eq(orders.status, filters.status) : undefined,
    filters.from ? gte(orders.createdAt, filters.from) : undefined,
    filters.to ? lte(orders.createdAt, filters.to) : undefined
  );
}

export class OrdersRepository {
  async findPage(
    offset: number,
    limit: number,
    filters: ListOrdersFilters
  ): Promise<OrderRecord[]> {
    return db
      .select()
      .from(orders)
      .where(buildListWhereClause(filters))
      .orderBy(asc(orders.id))
      .offset(offset)
      .limit(limit);
  }

  async countAll(filters: ListOrdersFilters): Promise<number> {
    const [result] = await db
      .select({ total: count() })
      .from(orders)
      .where(buildListWhereClause(filters));

    return Number(result?.total ?? 0);
  }

  async findById(id: number): Promise<OrderRecord | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
}
