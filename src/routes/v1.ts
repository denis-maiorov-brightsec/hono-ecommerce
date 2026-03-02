import { Hono } from "hono";

import {
  createWriteRateLimitMiddleware,
  type WriteRateLimitOptions
} from "../common/middleware/write-rate-limit";
import { createCategoriesRouter } from "../modules/categories/routes/categories.routes";
import { createOrdersRouter } from "../modules/orders/routes/orders.routes";
import { createPromotionsRouter } from "../modules/promotions/routes/promotions.routes";
import { createProductsRouter } from "../modules/products/routes/products.routes";

export type RegisterV1RoutesOptions = {
  writeRateLimit?: WriteRateLimitOptions;
};

export function registerV1Routes(
  app: Hono,
  options: RegisterV1RoutesOptions = {}
): void {
  const v1 = new Hono();
  v1.use("*", createWriteRateLimitMiddleware(options.writeRateLimit));

  v1.get("/health", (c) => {
    return c.json({ status: "ok" });
  });

  v1.route("/products", createProductsRouter());
  v1.route("/categories", createCategoriesRouter());
  v1.route("/orders", createOrdersRouter());
  v1.route("/promotions", createPromotionsRouter());

  app.route("/v1", v1);
}
