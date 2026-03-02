import { Hono } from "hono";

import { registerErrorEnvelope } from "./common/middleware/error-envelope";
import { registerValidationPipeline } from "./common/middleware/validation-pipeline";
import { registerBaseRoutes } from "./routes/base";
import { registerV1Routes, type RegisterV1RoutesOptions } from "./routes/v1";

export type CreateAppOptions = RegisterV1RoutesOptions;

export function createApp(options: CreateAppOptions = {}): Hono {
  const app = new Hono();

  registerErrorEnvelope(app);
  registerValidationPipeline(app);
  registerBaseRoutes(app);
  registerV1Routes(app, options);

  return app;
}
