import { z } from "zod";

const NON_EMPTY_TEXT_MESSAGE = "must not be empty";

export const productIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("id must be an integer")
    .positive("id must be a positive integer")
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, `name ${NON_EMPTY_TEXT_MESSAGE}`),
  sku: z.string().trim().min(1, `sku ${NON_EMPTY_TEXT_MESSAGE}`),
  price: z.number().positive("price must be greater than 0"),
  status: z.string().trim().min(1, `status ${NON_EMPTY_TEXT_MESSAGE}`),
  categoryId: z
    .number()
    .int("categoryId must be an integer")
    .positive("categoryId must be a positive integer")
    .nullable()
    .optional()
});

export const updateProductSchema = createProductSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "at least one field must be provided"
  });

export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type CreateProductPayload = z.infer<typeof createProductSchema>;
export type UpdateProductPayload = z.infer<typeof updateProductSchema>;
