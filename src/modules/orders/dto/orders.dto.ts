import { z } from "zod";

import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT
} from "../../../common/pagination";

const NON_EMPTY_TEXT_MESSAGE = "must not be empty";

const orderDateQuerySchema = (field: "from" | "to") =>
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: `${field} must be a valid date`
    })
    .transform((value) => new Date(value));

export const orderIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("id must be an integer")
    .positive("id must be a positive integer")
});

export const listOrdersQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int("page must be an integer")
      .positive("page must be a positive integer")
      .optional(),
    limit: z.coerce
      .number()
      .int("limit must be an integer")
      .positive("limit must be a positive integer")
      .max(MAX_LIMIT, `limit must be less than or equal to ${MAX_LIMIT}`)
      .optional(),
    status: z.string().trim().min(1, `status ${NON_EMPTY_TEXT_MESSAGE}`).optional(),
    from: orderDateQuerySchema("from").optional(),
    to: orderDateQuerySchema("to").optional()
  })
  .superRefine(({ from, to }, ctx) => {
    if (from && to && from > to) {
      ctx.addIssue({
        code: "custom",
        path: ["from"],
        message: "from must be less than or equal to to"
      });
    }
  })
  .transform(({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, ...filters }) => ({
    page,
    limit,
    offset: (page - 1) * limit,
    ...filters
  }));

export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
