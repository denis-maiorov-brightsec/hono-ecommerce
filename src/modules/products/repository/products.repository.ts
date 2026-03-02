import { asc, count, eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { db } from "../../../db/client";
import { products } from "../../../db/schema";

export type ProductRecord = InferSelectModel<typeof products>;

export type CreateProductRecord = Pick<
  InferInsertModel<typeof products>,
  "name" | "sku" | "price" | "status" | "categoryId"
>;

export type UpdateProductRecord = Partial<CreateProductRecord>;

export class ProductsRepository {
  async findPage(offset: number, limit: number): Promise<ProductRecord[]> {
    return db
      .select()
      .from(products)
      .orderBy(asc(products.id))
      .offset(offset)
      .limit(limit);
  }

  async countAll(): Promise<number> {
    const [result] = await db.select({ total: count() }).from(products);
    return Number(result?.total ?? 0);
  }

  async findById(id: number): Promise<ProductRecord | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async create(payload: CreateProductRecord): Promise<ProductRecord> {
    const [product] = await db.insert(products).values(payload).returning();
    return product;
  }

  async updateById(
    id: number,
    payload: UpdateProductRecord
  ): Promise<ProductRecord | undefined> {
    const [product] = await db
      .update(products)
      .set({
        ...payload,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();

    return product;
  }

  async deleteById(id: number): Promise<boolean> {
    const [product] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });

    return Boolean(product);
  }
}
