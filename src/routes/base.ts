import type { Hono } from "hono";

export function registerBaseRoutes(app: Hono): void {
  app.get("/", (c) => {
    c.header("Deprecation", "true");

    return c.json({
      message: "This unversioned root route is deprecated. Migrate to /v1/health."
    });
  });
}
