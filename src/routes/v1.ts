import { Hono } from "hono";

import { createProductsRouter } from "../modules/products/routes/products.routes";

export function registerV1Routes(app: Hono): void {
  const v1 = new Hono();

  v1.get("/health", (c) => {
    return c.json({ status: "ok" });
  });

  v1.route("/products", createProductsRouter());

  app.route("/v1", v1);
}
