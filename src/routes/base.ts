import type { Hono } from "hono";

export function registerBaseRoutes(app: Hono): void {
  app.get("/", (c) => {
    return c.json({
      service: "hono-ecommerce",
      message: "unversioned routes are temporary and will move under /v1"
    });
  });

  app.get("/health", (c) => {
    return c.json({ status: "ok" });
  });
}
