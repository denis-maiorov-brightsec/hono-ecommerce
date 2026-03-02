import { Hono } from "hono";

import { createCategoriesRouter } from "../modules/categories/routes/categories.routes";
import { createOrdersRouter } from "../modules/orders/routes/orders.routes";
import { createProductsRouter } from "../modules/products/routes/products.routes";

export function registerV1Routes(app: Hono): void {
  const v1 = new Hono();

  v1.get("/health", (c) => {
    return c.json({ status: "ok" });
  });

  v1.route("/products", createProductsRouter());
  v1.route("/categories", createCategoriesRouter());
  v1.route("/orders", createOrdersRouter());

  app.route("/v1", v1);
}
