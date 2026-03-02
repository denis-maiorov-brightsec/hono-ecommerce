import { asc, eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { db } from "../../../db/client";
import { promotions } from "../../../db/schema";

export type PromotionRecord = InferSelectModel<typeof promotions>;

export type CreatePromotionRecord = Pick<
  InferInsertModel<typeof promotions>,
  | "name"
  | "code"
  | "discountType"
  | "discountValue"
  | "startsAt"
  | "endsAt"
  | "status"
>;

export type UpdatePromotionRecord = Partial<CreatePromotionRecord>;

export class PromotionsRepository {
  async findAll(): Promise<PromotionRecord[]> {
    return db.select().from(promotions).orderBy(asc(promotions.id));
  }

  async findById(id: number): Promise<PromotionRecord | undefined> {
    const [promotion] = await db.select().from(promotions).where(eq(promotions.id, id));
    return promotion;
  }

  async create(payload: CreatePromotionRecord): Promise<PromotionRecord> {
    const [promotion] = await db.insert(promotions).values(payload).returning();
    return promotion;
  }

  async updateById(
    id: number,
    payload: UpdatePromotionRecord
  ): Promise<PromotionRecord | undefined> {
    const [promotion] = await db
      .update(promotions)
      .set({
        ...payload,
        updatedAt: new Date()
      })
      .where(eq(promotions.id, id))
      .returning();

    return promotion;
  }

  async deleteById(id: number): Promise<boolean> {
    const [promotion] = await db
      .delete(promotions)
      .where(eq(promotions.id, id))
      .returning({ id: promotions.id });

    return Boolean(promotion);
  }
}
