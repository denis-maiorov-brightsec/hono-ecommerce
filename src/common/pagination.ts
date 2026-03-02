import { z } from "zod";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const paginationQuerySchema = z
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

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

type PaginationMetadataInput = {
  page: number;
  limit: number;
  total: number;
};

export type PaginationMetadata = PaginationMetadataInput & {
  totalPages: number;
};

export type PaginatedResponse<TItem> = {
  items: TItem[];
  pagination: PaginationMetadata;
};

export function buildPaginationMetadata(
  input: PaginationMetadataInput
): PaginationMetadata {
  return {
    ...input,
    totalPages: input.total === 0 ? 0 : Math.ceil(input.total / input.limit)
  };
}

export function buildPaginatedResponse<TItem>(
  items: TItem[],
  input: PaginationMetadataInput
): PaginatedResponse<TItem> {
  return {
    items,
    pagination: buildPaginationMetadata(input)
  };
}
