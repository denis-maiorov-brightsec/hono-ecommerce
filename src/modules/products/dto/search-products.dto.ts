import { z } from "zod";

const NON_EMPTY_TEXT_MESSAGE = "must not be empty";

export const searchProductsQuerySchema = z.object({
  q: z.string().trim().min(1, `q ${NON_EMPTY_TEXT_MESSAGE}`)
});

export type SearchProductsQuery = z.infer<typeof searchProductsQuerySchema>;
