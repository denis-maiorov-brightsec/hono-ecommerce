import { Hono } from "hono";

export function registerV1Routes(app: Hono): void {
  const v1 = new Hono();

  v1.get("/health", (c) => {
    return c.json({ status: "ok" });
  });

  app.route("/v1", v1);
}
