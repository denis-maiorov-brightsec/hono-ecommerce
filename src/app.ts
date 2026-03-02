import { Hono } from "hono";

import { registerErrorEnvelope } from "./common/middleware/error-envelope";
import { registerValidationPipeline } from "./common/middleware/validation-pipeline";
import { registerBaseRoutes } from "./routes/base";
import { registerV1Routes } from "./routes/v1";

export function createApp(): Hono {
  const app = new Hono();

  registerErrorEnvelope(app);
  registerValidationPipeline(app);
  registerBaseRoutes(app);
  registerV1Routes(app);

  return app;
}
