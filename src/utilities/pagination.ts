export interface PaginateOptions {
  page?: number;
  limit?: number;
  sort?: string;
}

export function parsePagination(query: any): Required<PaginateOptions> {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit as string) || 10)
  );
  const sort = (query.sort as string) || "-createdAt";
  return { page, limit, sort };
}

export function buildPaginationResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
) {
  const pages = Math.ceil(total / limit);
  return {
    items,
    meta: { total, page, limit, pages },
  };
}
