import { z } from "zod";

const NON_EMPTY_TEXT_MESSAGE = "must not be empty";
const SKU_ALIAS_CONFLICT_MESSAGE =
  "stockKeepingUnit and deprecated sku must match when both are provided";

function normalizeDeprecatedSkuAlias(
  payload: { stockKeepingUnit?: string; sku?: string }
): string | undefined {
  return payload.stockKeepingUnit ?? payload.sku;
}

export const productIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("id must be an integer")
    .positive("id must be a positive integer")
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, `name ${NON_EMPTY_TEXT_MESSAGE}`),
  stockKeepingUnit: z
    .string()
    .trim()
    .min(1, `stockKeepingUnit ${NON_EMPTY_TEXT_MESSAGE}`)
    .optional(),
  // `sku` is a deprecated request alias retained for backwards compatibility in spec-013.
  sku: z.string().trim().min(1, `sku ${NON_EMPTY_TEXT_MESSAGE}`).optional(),
  price: z.number().positive("price must be greater than 0"),
  status: z.string().trim().min(1, `status ${NON_EMPTY_TEXT_MESSAGE}`),
  categoryId: z
    .number()
    .int("categoryId must be an integer")
    .positive("categoryId must be a positive integer")
    .nullable()
    .optional()
})
  .superRefine((payload, ctx) => {
    if (
      payload.stockKeepingUnit !== undefined &&
      payload.sku !== undefined &&
      payload.stockKeepingUnit !== payload.sku
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["stockKeepingUnit"],
        message: SKU_ALIAS_CONFLICT_MESSAGE
      });
    }

    if (normalizeDeprecatedSkuAlias(payload) === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["stockKeepingUnit"],
        message: `stockKeepingUnit ${NON_EMPTY_TEXT_MESSAGE}`
      });
    }
  })
  .transform(({ sku, stockKeepingUnit, ...payload }) => ({
    ...payload,
    stockKeepingUnit: normalizeDeprecatedSkuAlias({ stockKeepingUnit, sku }) as string
  }));

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, `name ${NON_EMPTY_TEXT_MESSAGE}`).optional(),
    stockKeepingUnit: z
      .string()
      .trim()
      .min(1, `stockKeepingUnit ${NON_EMPTY_TEXT_MESSAGE}`)
      .optional(),
    // `sku` is a deprecated request alias retained for backwards compatibility in spec-013.
    sku: z.string().trim().min(1, `sku ${NON_EMPTY_TEXT_MESSAGE}`).optional(),
    price: z.number().positive("price must be greater than 0").optional(),
    status: z.string().trim().min(1, `status ${NON_EMPTY_TEXT_MESSAGE}`).optional(),
    categoryId: z
      .number()
      .int("categoryId must be an integer")
      .positive("categoryId must be a positive integer")
      .nullable()
      .optional()
  })
  .superRefine((payload, ctx) => {
    if (Object.keys(payload).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "at least one field must be provided"
      });
    }

    if (
      payload.stockKeepingUnit !== undefined &&
      payload.sku !== undefined &&
      payload.stockKeepingUnit !== payload.sku
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["stockKeepingUnit"],
        message: SKU_ALIAS_CONFLICT_MESSAGE
      });
    }
  })
  .transform(({ sku, stockKeepingUnit, ...payload }) => {
    const normalizedStockKeepingUnit = normalizeDeprecatedSkuAlias({
      stockKeepingUnit,
      sku
    });

    if (normalizedStockKeepingUnit === undefined) {
      return payload;
    }

    return {
      ...payload,
      stockKeepingUnit: normalizedStockKeepingUnit
    };
  });

export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type CreateProductPayload = z.infer<typeof createProductSchema>;
export type UpdateProductPayload = z.infer<typeof updateProductSchema>;
