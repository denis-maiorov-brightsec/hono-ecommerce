export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

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
