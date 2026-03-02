import { z } from "zod";

const NON_EMPTY_TEXT_MESSAGE = "must not be empty";
const INVALID_DATE_WINDOW_MESSAGE = "startsAt must be less than or equal to endsAt";

const dateFieldSchema = (field: "startsAt" | "endsAt") =>
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: `${field} must be a valid date`
    })
    .transform((value) => new Date(value));

const optionalNullableDateFieldSchema = (field: "startsAt" | "endsAt") =>
  z.union([dateFieldSchema(field), z.null()]).optional();

export const promotionIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("id must be an integer")
    .positive("id must be a positive integer")
});

const promotionPayloadSchema = z.object({
  name: z.string().trim().min(1, `name ${NON_EMPTY_TEXT_MESSAGE}`),
  code: z.string().trim().min(1, `code ${NON_EMPTY_TEXT_MESSAGE}`),
  discountType: z
    .string()
    .trim()
    .min(1, `discountType ${NON_EMPTY_TEXT_MESSAGE}`),
  discountValue: z.number(),
  startsAt: optionalNullableDateFieldSchema("startsAt"),
  endsAt: optionalNullableDateFieldSchema("endsAt"),
  status: z.string().trim().min(1, `status ${NON_EMPTY_TEXT_MESSAGE}`)
});

export const createPromotionSchema = promotionPayloadSchema.superRefine(
  ({ startsAt, endsAt }, ctx) => {
    if (startsAt && endsAt && startsAt > endsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: INVALID_DATE_WINDOW_MESSAGE
      });
    }
  }
);

export const updatePromotionSchema = promotionPayloadSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "at least one field must be provided"
  })
  .superRefine(({ startsAt, endsAt }, ctx) => {
    if (startsAt && endsAt && startsAt > endsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: INVALID_DATE_WINDOW_MESSAGE
      });
    }
  });

export type PromotionIdParams = z.infer<typeof promotionIdParamsSchema>;
export type CreatePromotionPayload = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionPayload = z.infer<typeof updatePromotionSchema>;
