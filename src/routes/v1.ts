import { Hono } from "hono";

export function registerV1Routes(app: Hono): void {
  const v1 = new Hono();

  app.route("/v1", v1);
}
