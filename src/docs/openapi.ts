import type { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

import { MAX_LIMIT } from "../common/pagination";

const V1_PRODUCTS_TAG = "v1/products";
const V1_ORDERS_TAG = "v1/orders";

const validationDetailSchema = z
  .object({
    field: z.string().openapi({
      example: "price"
    }),
    constraints: z.array(z.string()).openapi({
      example: ["price must be greater than 0"]
    })
  })
  .openapi("ValidationDetail");

const errorEnvelopeSchema = z
  .object({
    timestamp: z.string().datetime().openapi({
      example: "2025-01-10T08:00:00.000Z"
    }),
    path: z.string().openapi({
      example: "/v1/products"
    }),
    error: z.object({
      code: z.string().openapi({
        example: "VALIDATION_ERROR"
      }),
      message: z.string().openapi({
        example: "Request validation failed"
      }),
      details: z.array(validationDetailSchema).optional()
    })
  })
  .openapi("ErrorEnvelope");

const paginationMetadataSchema = z
  .object({
    page: z.number().int().positive().openapi({
      example: 1
    }),
    limit: z.number().int().positive().openapi({
      example: 20
    }),
    total: z.number().int().nonnegative().openapi({
      example: 1
    }),
    totalPages: z.number().int().nonnegative().openapi({
      example: 1
    })
  })
  .openapi("PaginationMetadata");

const productSchema = z
  .object({
    id: z.number().int().positive().openapi({
      example: 1
    }),
    name: z.string().openapi({
      example: "Contract Keyboard"
    }),
    stockKeepingUnit: z.string().openapi({
      example: "CNTR-KBD-001"
    }),
    price: z.number().openapi({
      example: 149.99
    }),
    status: z.string().openapi({
      example: "active"
    }),
    categoryId: z.number().int().positive().nullable().openapi({
      example: null
    }),
    createdAt: z.string().datetime().openapi({
      example: "2025-01-10T08:00:00.000Z"
    }),
    updatedAt: z.string().datetime().openapi({
      example: "2025-01-10T08:00:00.000Z"
    })
  })
  .openapi("Product");

const paginatedProductsSchema = z
  .object({
    items: z.array(productSchema),
    pagination: paginationMetadataSchema
  })
  .openapi("PaginatedProductsResponse");

const orderItemSchema = z
  .object({
    productId: z.number().int().positive().openapi({
      example: 11
    }),
    quantity: z.number().int().positive().openapi({
      example: 1
    }),
    unitPrice: z.number().openapi({
      example: 149.99
    })
  })
  .openapi("OrderItem");

const orderSchema = z
  .object({
    id: z.number().int().positive().openapi({
      example: 1
    }),
    status: z.string().openapi({
      example: "pending"
    }),
    customerId: z.number().int().positive().openapi({
      example: 1001
    }),
    items: z.array(orderItemSchema),
    totalAmount: z.number().openapi({
      example: 149.99
    }),
    createdAt: z.string().datetime().openapi({
      example: "2025-01-10T08:00:00.000Z"
    }),
    updatedAt: z.string().datetime().openapi({
      example: "2025-01-10T08:00:00.000Z"
    })
  })
  .openapi("Order");

const paginatedOrdersSchema = z
  .object({
    items: z.array(orderSchema),
    pagination: paginationMetadataSchema
  })
  .openapi("PaginatedOrdersResponse");

const productIdParamsSchema = z.object({
  id: z.coerce.number().int().positive().openapi({
    param: {
      name: "id",
      in: "path"
    },
    example: 1
  })
});

const orderIdParamsSchema = z.object({
  id: z.coerce.number().int().positive().openapi({
    param: {
      name: "id",
      in: "path"
    },
    example: 1
  })
});

const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().openapi({
    param: {
      name: "page",
      in: "query"
    },
    example: 1
  }),
  limit: z.coerce.number().int().positive().max(MAX_LIMIT).optional().openapi({
    param: {
      name: "limit",
      in: "query"
    },
    example: 20
  })
});

const searchProductsQuerySchema = z.object({
  q: z.string().trim().min(1).openapi({
    param: {
      name: "q",
      in: "query"
    },
    example: "KBD-001"
  })
});

const createProductRequestSchema = z
  .object({
    name: z.string().trim().min(1).openapi({
      example: "Contract Keyboard"
    }),
    stockKeepingUnit: z.string().trim().min(1).optional().openapi({
      description: "Preferred field for SKU value.",
      example: "CNTR-KBD-001"
    }),
    sku: z.string().trim().min(1).optional().openapi({
      deprecated: true,
      description:
        "Deprecated alias for stockKeepingUnit. If both fields are sent they must match.",
      example: "CNTR-KBD-001"
    }),
    price: z.number().positive().openapi({
      example: 149.99
    }),
    status: z.string().trim().min(1).openapi({
      example: "active"
    }),
    categoryId: z.number().int().positive().nullable().optional().openapi({
      example: 2
    })
  })
  .openapi("CreateProductRequest");

const updateProductRequestSchema = z
  .object({
    name: z.string().trim().min(1).optional().openapi({
      example: "Contract Keyboard v2"
    }),
    stockKeepingUnit: z.string().trim().min(1).optional().openapi({
      description: "Preferred field for SKU value.",
      example: "CNTR-KBD-002"
    }),
    sku: z.string().trim().min(1).optional().openapi({
      deprecated: true,
      description:
        "Deprecated alias for stockKeepingUnit. If both fields are sent they must match.",
      example: "CNTR-KBD-002"
    }),
    price: z.number().positive().optional().openapi({
      example: 159.99
    }),
    status: z.string().trim().min(1).optional().openapi({
      example: "archived"
    }),
    categoryId: z.number().int().positive().nullable().optional().openapi({
      example: null
    })
  })
  .openapi("UpdateProductRequest");

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().openapi({
    param: {
      name: "page",
      in: "query"
    },
    example: 1
  }),
  limit: z.coerce.number().int().positive().max(MAX_LIMIT).optional().openapi({
    param: {
      name: "limit",
      in: "query"
    },
    example: 20
  }),
  status: z.string().trim().min(1).optional().openapi({
    param: {
      name: "status",
      in: "query"
    },
    example: "pending"
  }),
  from: z.string().datetime().optional().openapi({
    param: {
      name: "from",
      in: "query"
    },
    example: "2025-01-01T00:00:00.000Z"
  }),
  to: z.string().datetime().optional().openapi({
    param: {
      name: "to",
      in: "query"
    },
    example: "2025-01-31T23:59:59.999Z"
  })
});

type ErrorDetailExample = {
  field: string;
  constraints: string[];
};

function buildErrorExample(
  path: string,
  code: string,
  message: string,
  details?: ErrorDetailExample[]
) {
  return {
    timestamp: "2025-01-10T08:00:00.000Z",
    path,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  };
}

function registerProductsPaths(app: OpenAPIHono): void {
  app.openAPIRegistry.registerPath({
    method: "get",
    path: "/v1/products",
    operationId: "listProductsV1",
    summary: "List products",
    tags: [V1_PRODUCTS_TAG],
    request: {
      query: listProductsQuerySchema
    },
    responses: {
      200: {
        description: "Paginated products response.",
        content: {
          "application/json": {
            schema: paginatedProductsSchema,
            example: {
              items: [
                {
                  id: 1,
                  name: "Contract Keyboard",
                  stockKeepingUnit: "CNTR-KBD-001",
                  price: 149.99,
                  status: "active",
                  categoryId: null,
                  createdAt: "2025-01-10T08:00:00.000Z",
                  updatedAt: "2025-01-10T08:00:00.000Z"
                }
              ],
              pagination: {
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1
              }
            }
          }
        }
      },
      400: {
        description: "Validation error envelope.",
        content: {
          "application/json": {
            schema: errorEnvelopeSchema,
            example: buildErrorExample(
              "/v1/products",
              "VALIDATION_ERROR",
              "Request validation failed",
              [
                {
                  field: "limit",
                  constraints: [
                    `limit must be less than or equal to ${MAX_LIMIT}`
                  ]
                }
              ]
            )
          }
        }
      }
    }
  });

  app.openAPIRegistry.registerPath({
    method: "post",
    path: "/v1/products",
    operationId: "createProductV1",
    summary: "Create product",
    description:
      "Creates a product. `sku` is a deprecated request alias for `stockKeepingUnit`.",
    tags: [V1_PRODUCTS_TAG],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createProductRequestSchema,
            example: {
              name: "Contract Keyboard",
              stockKeepingUnit: "CNTR-KBD-001",
              price: 149.99,
              status: "active",
              categoryId: 2
            }
          }
        }
      }
    },
    responses: {
      201: {
        description: "Created product response.",
        content: {
          "application/json": {
            schema: productSchema,
            example: {
              id: 1,
              name: "Contract Keyboard",
              stockKeepingUnit: "CNTR-KBD-001",
              price: 149.99,
              status: "active",
              categoryId: 2,
              createdAt: "2025-01-10T08:00:00.000Z",
              updatedAt: "2025-01-10T08:00:00.000Z"
            }
          }
        }
      },
      400: {
        description: "Validation error envelope.",
        content: {
          "application/json": {
            schema: errorEnvelopeSchema,
            example: buildErrorExample(
              "/v1/products",
              "VALIDATION_ERROR",
              "Request validation failed",
              [
                {
                  field: "price",
                  constraints: ["price must be greater than 0"]
                }
              ]
            )
          }
        }
      }
    }
  });

  app.openAPIRegistry.registerPath({
    method: "get",
    path: "/v1/products/{id}",
    operationId: "getProductByIdV1",
    summary: "Get product by id",
    tags: [V1_PRODUCTS_TAG],
    request: {
      params: productIdParamsSchema
    },
    responses: {
      200: {
        description: "Product detail response.",
        content: {
          "application/json": {
            schema: productSchema,
            example: {
              id: 1,
              name: "Contract Keyboard",
              stockKeepingUnit: "CNTR-KBD-001",
              price: 149.99,
              status: "active",
              categoryId: null,
              createdAt: "2025-01-10T08:00:00.000Z",
              updatedAt: "2025-01-10T08:00:00.000Z"
            }
          }
        }
      },
      404: {
        description: "Not-found error envelope.",
        content: {
          "application/json": {
            schema: errorEnvelopeSchema,
            example: buildErrorExample(
              "/v1/products/999999",
              "NOT_FOUND",
              "Product not found"
            )
          }
        }
      }
    }
  });

  app.openAPIRegistry.registerPath({
    method: "patch",
    path: "/v1/products/{id}",
    operationId: "updateProductV1",
    summary: "Update product by id",
    description:
      "Updates a product. `sku` is a deprecated request alias for `stockKeepingUnit`.",
    tags: [V1_PRODUCTS_TAG],
    request: {
      params: productIdParamsSchema,
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateProductRequestSchema,
            example: {
              sku: "CNTR-KBD-002",
              status: "archived"
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: "Updated product response.",
        content: {
          "application/json": {
            schema: productSchema,
            example: {
              id: 1,
              name: "Contract Keyboard",
              stockKeepingUnit: "CNTR-KBD-002",
              price: 149.99,
              status: "archived",
              categoryId: null,
              createdAt: "2025-01-10T08:00:00.000Z",
              updatedAt: "2025-01-10T09:00:00.000Z"
            }
          }
        }
      },
      400: {
        description: "Validation error envelope.",
        content: {
          "application/json": {
            schema: errorEnvelopeSchema,
            example: buildErrorExample(
              "/v1/products/1",
              "VALIDATION_ERROR",
              "Request validation failed",
              [
                {
                  field: "json",
                  constraints: ["at least one field must be provided"]
                }
              ]
            )
          }
        }
      },
      404: {
        description: "Not-found error envelope.",
        content: {
          "application/json": {
            schema: errorEnvelopeSchema,
            example: buildErrorExample(
              "/v1/products/999999",
              "NOT_FOUND",
              "Product not found"
            )
          }
        }
      }
    }
  });

  app.openAPIRegistry.registerPath({
    method: "delete",
    path: "/v1/products/{id}",
    operationId: "deleteProductV1",
    summary: "Delete product by id",
    tags: [V1_PRODUCTS_TAG],
    request: {
      params: productIdParamsSchema
    },
    responses: {
      204: {
        description: "Product deleted."
      },
      404: {
        description: "Not-found error envelope.",
        content: {
          "application/json": {
            schema: errorEnvelopeSchema,
            example: buildErrorExample(
              "/v1/products/999999",
              "NOT_FOUND",
              "Product not found"
            )
          }
        }
      }
    }
  });

  app.openAPIRegistry.registerPath({
    method: "get",
    path: "/v1/search/products",
    operationId: "searchProductsV1",
    summary: "Search products",
    tags: [V1_PRODUCTS_TAG],
    request: {
      query: searchProductsQuerySchema
    },
    responses: {
      200: {
        description: "Search results for products.",
        content: {
          "application/json": {
            schema: z.array(productSchema),
            example: [
              {
                id: 1,
                name: "Contract Keyboard",
                stockKeepingUnit: "CNTR-KBD-002",
                price: 149.99,
                status: "archived",
                categoryId: null,
                createdAt: "2025-01-10T08:00:00.000Z",
                updatedAt: "2025-01-10T09:00:00.000Z"
              }
            ]
          }
        }
      },
      400: {
        description: "Validation error envelope.",
        content: {
          "application/json": {
            schema: errorEnvelopeSchema,
            example: buildErrorExample(
              "/v1/search/products",
              "VALIDATION_ERROR",
              "Request validation failed",
              [
                {
                  field: "q",
                  constraints: ["q must not be empty"]
                }
              ]
            )
          }
        }
      }
    }
  });
}

function registerOrdersPaths(app: OpenAPIHono): void {
  app.openAPIRegistry.registerPath({
    method: "get",
    path: "/v1/orders",
    operationId: "listOrdersV1",
    summary: "List orders",
    tags: [V1_ORDERS_TAG],
    request: {
      query: listOrdersQuerySchema
    },
    responses: {
      200: {
        description: "Paginated orders response.",
        content: {
          "application/json": {
            schema: paginatedOrdersSchema,
            example: {
              items: [
                {
                  id: 1,
                  status: "pending",
                  customerId: 1001,
                  items: [{ productId: 11, quantity: 1, unitPrice: 149.99 }],
                  totalAmount: 149.99,
                  createdAt: "2025-01-10T09:00:00.000Z",
                  updatedAt: "2025-01-10T09:00:00.000Z"
                }
              ],
              pagination: {
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1
              }
            }
          }
        }
      },
      400: {
        description: "Validation error envelope.",
        content: {
          "application/json": {
            schema: errorEnvelopeSchema,
            example: buildErrorExample(
              "/v1/orders",
              "VALIDATION_ERROR",
              "Request validation failed",
              [
                {
                  field: "from",
                  constraints: ["from must be a valid date"]
                }
              ]
            )
          }
        }
      }
    }
  });

  app.openAPIRegistry.registerPath({
    method: "get",
    path: "/v1/orders/{id}",
    operationId: "getOrderByIdV1",
    summary: "Get order by id",
    tags: [V1_ORDERS_TAG],
    request: {
      params: orderIdParamsSchema
    },
    responses: {
      200: {
        description: "Order detail response.",
        content: {
          "application/json": {
            schema: orderSchema,
            example: {
              id: 1,
              status: "pending",
              customerId: 1001,
              items: [{ productId: 11, quantity: 1, unitPrice: 149.99 }],
              totalAmount: 149.99,
              createdAt: "2025-01-10T09:00:00.000Z",
              updatedAt: "2025-01-10T09:00:00.000Z"
            }
          }
        }
      },
      404: {
        description: "Not-found error envelope.",
        content: {
          "application/json": {
            schema: errorEnvelopeSchema,
            example: buildErrorExample(
              "/v1/orders/999999",
              "NOT_FOUND",
              "Order not found"
            )
          }
        }
      }
    }
  });

  app.openAPIRegistry.registerPath({
    method: "post",
    path: "/v1/orders/{id}/cancel",
    operationId: "cancelOrderByIdV1",
    summary: "Cancel order (state transition)",
    description:
      "State transition operation that changes an order status from `pending` to `cancelled`.",
    tags: [V1_ORDERS_TAG],
    request: {
      params: orderIdParamsSchema
    },
    responses: {
      200: {
        description: "Cancelled order response.",
        content: {
          "application/json": {
            schema: orderSchema,
            example: {
              id: 1,
              status: "cancelled",
              customerId: 1001,
              items: [{ productId: 11, quantity: 1, unitPrice: 149.99 }],
              totalAmount: 149.99,
              createdAt: "2025-01-10T09:00:00.000Z",
              updatedAt: "2025-01-10T10:00:00.000Z"
            }
          }
        }
      },
      404: {
        description: "Not-found error envelope.",
        content: {
          "application/json": {
            schema: errorEnvelopeSchema,
            example: buildErrorExample(
              "/v1/orders/999999/cancel",
              "NOT_FOUND",
              "Order not found"
            )
          }
        }
      },
      409: {
        description: "Conflict error envelope for non-pending orders.",
        content: {
          "application/json": {
            schema: errorEnvelopeSchema,
            example: buildErrorExample(
              "/v1/orders/5/cancel",
              "CONFLICT",
              "Only pending orders can be cancelled"
            )
          }
        }
      }
    }
  });
}

export function registerOpenApiDocs(app: OpenAPIHono): void {
  registerProductsPaths(app);
  registerOrdersPaths(app);

  app.doc("/docs/openapi.json", (c) => ({
    openapi: "3.0.0",
    info: {
      title: "Hono E-commerce Backoffice API",
      version: "v1",
      description: "OpenAPI documentation for v1 products and orders endpoints."
    },
    servers: [
      {
        url: new URL(c.req.url).origin,
        description: "Current environment"
      }
    ],
    tags: [
      {
        name: V1_PRODUCTS_TAG,
        description: "Products endpoints for API version v1."
      },
      {
        name: V1_ORDERS_TAG,
        description: "Orders endpoints for API version v1."
      }
    ]
  }));

  app.get(
    "/docs",
    swaggerUI({
      url: "/docs/openapi.json",
      title: "Hono E-commerce Backoffice API Docs"
    })
  );
}
