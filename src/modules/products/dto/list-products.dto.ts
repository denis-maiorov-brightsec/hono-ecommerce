import { z } from "zod";

import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT
} from "../../../common/pagination";

export const listProductsQuerySchema = z
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
      .optional()
  })
  .transform(({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT }) => ({
    page,
    limit,
    offset: (page - 1) * limit
  }));

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
