import { Hono } from "hono";

import { registerBaseRoutes } from "./routes/base";
import { registerV1Routes } from "./routes/v1";

export function createApp(): Hono {
  const app = new Hono();

  registerBaseRoutes(app);
  registerV1Routes(app);

  return app;
}
