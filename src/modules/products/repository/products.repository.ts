import { asc, eq } from "drizzle-orm";
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
  async findAll(): Promise<ProductRecord[]> {
    return db.select().from(products).orderBy(asc(products.id));
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
