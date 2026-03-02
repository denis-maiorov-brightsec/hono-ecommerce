import { OpenAPIHono } from "@hono/zod-openapi";

import { registerErrorEnvelope } from "./common/middleware/error-envelope";
import {
  createRequestObservabilityMiddleware,
  type RequestObservabilityOptions
} from "./common/middleware/request-observability";
import { registerOpenApiDocs } from "./docs/openapi";
import { registerValidationPipeline } from "./common/middleware/validation-pipeline";
import { registerBaseRoutes } from "./routes/base";
import { registerV1Routes, type RegisterV1RoutesOptions } from "./routes/v1";

export type CreateAppOptions = RegisterV1RoutesOptions & {
  requestObservability?: RequestObservabilityOptions;
};

export function createApp(options: CreateAppOptions = {}): OpenAPIHono {
  const app = new OpenAPIHono();

  app.use(
    "*",
    createRequestObservabilityMiddleware(options.requestObservability)
  );
  registerErrorEnvelope(app);
  registerValidationPipeline(app);
  registerBaseRoutes(app);
  registerV1Routes(app, options);
  registerOpenApiDocs(app);

  return app;
}
