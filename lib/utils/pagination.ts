/**
 * Pagination utilities for consistent pagination across API routes
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Parse pagination parameters from URL search params
 * @param searchParams - URL search params
 * @param defaultLimit - Default page size (default: 10)
 * @param maxLimit - Maximum allowed page size (default: 100)
 * @returns Parsed pagination parameters with skip/take values
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit = 10,
  maxLimit = 100
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  let limit = parseInt(searchParams.get('limit') || defaultLimit.toString());
  
  // Enforce max limit
  limit = Math.min(limit, maxLimit);
  limit = Math.max(1, limit);
  
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

/**
 * Create pagination metadata for API response
 * @param page - Current page number
 * @param limit - Page size
 * @param total - Total number of items
 * @returns Pagination metadata object
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Create complete pagination response
 * @param data - Array of data items
 * @param params - Pagination parameters
 * @param total - Total number of items
 * @returns Object with data and pagination metadata
 */
export function createPaginatedResponse<T>(
  data: T[],
  params: PaginationParams,
  total: number
) {
  return {
    data,
    pagination: createPaginationMeta(params.page, params.limit, total)
  };
}

/**
 * Extract pagination params from NextRequest
 * Convenience wrapper for API routes
 */
export function getPaginationFromRequest(
  request: Request,
  defaultLimit = 10,
  maxLimit = 100
): PaginationParams {
  const { searchParams } = new URL(request.url);
  return parsePaginationParams(searchParams, defaultLimit, maxLimit);
}

