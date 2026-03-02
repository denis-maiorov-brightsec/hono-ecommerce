import { describe, expect, it } from "bun:test";

import { createApp } from "../../src/app";

type OpenApiSchema = {
  $ref?: string;
  properties?: Record<string, unknown>;
};

function resolveSchema(
  document: Record<string, any>,
  schema: OpenApiSchema | undefined
): Record<string, unknown> | undefined {
  if (!schema) {
    return undefined;
  }

  if (!schema.$ref) {
    return schema as Record<string, unknown>;
  }

  const name = schema.$ref.split("/").at(-1);
  if (!name) {
    return undefined;
  }

  return document.components?.schemas?.[name] as Record<string, unknown> | undefined;
}

describe("openapi docs", () => {
  const app = createApp();

  it("serves docs UI and OpenAPI JSON", async () => {
    const jsonResponse = await app.request("/docs/openapi.json");
    expect(jsonResponse.status).toBe(200);

    const document = (await jsonResponse.json()) as Record<string, any>;
    expect(document.openapi).toBe("3.0.0");
    expect(document.paths["/v1/products"]).toBeDefined();
    expect(document.paths["/v1/orders"]).toBeDefined();
    expect(document.paths["/v1/orders/{id}/cancel"]).toBeDefined();

    const docsResponse = await app.request("/docs");
    expect(docsResponse.status).toBe(200);
    const docsHtml = await docsResponse.text();
    expect(docsHtml).toContain("SwaggerUIBundle");
    expect(docsHtml).toContain("/docs/openapi.json");
  });

  it("documents deprecated sku alias and cancel transition metadata", async () => {
    const response = await app.request("/docs/openapi.json");
    expect(response.status).toBe(200);

    const document = (await response.json()) as Record<string, any>;
    const createProductSchema = resolveSchema(
      document,
      document.paths["/v1/products"].post.requestBody.content["application/json"]
        .schema
    );

    const createProductProperties = (createProductSchema?.properties ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    const skuSchema = createProductProperties.sku;

    expect(skuSchema).toBeDefined();
    expect(skuSchema?.deprecated).toBe(true);

    const cancelOperation = document.paths["/v1/orders/{id}/cancel"].post;
    expect(cancelOperation.summary).toContain("state transition");
    expect(cancelOperation.description).toContain("pending");
    expect(cancelOperation.description).toContain("cancelled");

    const tags = (document.tags as Array<{ name: string }>).map(
      (tag) => tag.name
    );
    expect(tags).toContain("v1/products");
    expect(tags).toContain("v1/orders");
  });
});
