import { asc, eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { db } from "../../../db/client";
import { categories } from "../../../db/schema";

export type CategoryRecord = InferSelectModel<typeof categories>;

export type CreateCategoryRecord = Pick<
  InferInsertModel<typeof categories>,
  "name" | "slug" | "description"
>;

export type UpdateCategoryRecord = Partial<CreateCategoryRecord>;

export class CategoriesRepository {
  async findAll(): Promise<CategoryRecord[]> {
    return db.select().from(categories).orderBy(asc(categories.id));
  }

  async findById(id: number): Promise<CategoryRecord | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async create(payload: CreateCategoryRecord): Promise<CategoryRecord> {
    const [category] = await db.insert(categories).values(payload).returning();
    return category;
  }

  async updateById(
    id: number,
    payload: UpdateCategoryRecord
  ): Promise<CategoryRecord | undefined> {
    const [category] = await db
      .update(categories)
      .set({
        ...payload,
        updatedAt: new Date()
      })
      .where(eq(categories.id, id))
      .returning();

    return category;
  }

  async deleteById(id: number): Promise<boolean> {
    const [category] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });

    return Boolean(category);
  }
}
