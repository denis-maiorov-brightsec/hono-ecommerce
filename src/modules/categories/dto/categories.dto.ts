import { z } from "zod";

const NON_EMPTY_TEXT_MESSAGE = "must not be empty";

export const categoryIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("id must be an integer")
    .positive("id must be a positive integer")
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, `name ${NON_EMPTY_TEXT_MESSAGE}`),
  slug: z.string().trim().min(1, `slug ${NON_EMPTY_TEXT_MESSAGE}`),
  description: z
    .string()
    .trim()
    .min(1, `description ${NON_EMPTY_TEXT_MESSAGE}`)
    .nullable()
    .optional()
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "at least one field must be provided"
  });

export type CategoryIdParams = z.infer<typeof categoryIdParamsSchema>;
export type CreateCategoryPayload = z.infer<typeof createCategorySchema>;
export type UpdateCategoryPayload = z.infer<typeof updateCategorySchema>;
