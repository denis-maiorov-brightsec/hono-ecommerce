import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

Bun.serve({
  fetch: app.fetch,
  port: env.PORT
});

console.log(`hono-ecommerce listening on http://localhost:${env.PORT}`);
