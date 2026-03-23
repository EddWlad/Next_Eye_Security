import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export function hasPaginationQuery(query?: PaginationQueryDto): boolean {
  return query?.page !== undefined;
}

export function resolvePagination(
  query?: PaginationQueryDto,
  defaultLimit = DEFAULT_LIMIT,
): PaginationOptions {
  const page = Math.max(DEFAULT_PAGE, Number(query?.page ?? DEFAULT_PAGE));
  const limit = Math.max(1, Math.min(100, Number(query?.limit ?? defaultLimit)));
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
    items,
  };
}
