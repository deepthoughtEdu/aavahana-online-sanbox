// src/types/api.types.ts
import { UseQueryResult } from "@tanstack/react-query";

/**
 * ============================================
 * PAGINATION TYPES
 * ============================================
 */

export interface PaginationInfo {
  prev: {
    page: number;
    active: boolean;
  };
  next: {
    page: number;
    active: boolean;
  };
  first: {
    page: number;
    active: boolean;
  };
  last: {
    page: number;
    active: boolean;
  };
  rel: unknown[];
  pages: unknown[];
  currentPage: number;
  pageCount: number;
}

/**
 * ============================================
 * API RESPONSE TYPES
 * ============================================
 */

export interface ApiResponse<T> {
  status: {
    code: string;
    message: string;
  };
  response: T;
}

/**
 * Response with pagination wrapper
 * Used when API returns: { data: T[], pagination: PaginationInfo }
 * (Organization endpoints)
 */
export interface PaginatedResponseWrapper<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * PDGMS backend pagination shape (from helpers.paginatedResponse()).
 * Used by all /v3/pdgms/* endpoints.
 */
export interface BackendPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export type RequestBody = 
  | Record<string, unknown> 
  | FormData 
  | string 
  | number 
  | boolean 
  | null 
  | undefined;

/**
 * ============================================
 * REACT QUERY RESULT TYPES
 * ============================================
 * 
 * Three response states:
 * 1. Single object: T (e.g., User, ThreadBuilder)
 * 2. Array without pagination: T[] (e.g., User[], ThreadBuilder[])
 * 3. Array with pagination: { data: T[], pagination: PaginationInfo }
 * 
 * CRITICAL: These types DO NOT include error unions because:
 * - useApi hook throws errors (React Query catches them)
 * - Errors exposed through React Query's error property
 * - Data is always clean: T | undefined (no { error } union)
 */

/**
 * Result type for paginated queries
 * Used when response is: { data: T[], pagination: PaginationInfo }
 * 
 * @example
 * const { data, pagination, error } = useApi({
 *   queryFn: () => ThreadBuilderService.listAll({ page: 1 })
 * });
 * // data: ThreadBuilder[] | undefined ✅
 * // pagination: PaginationInfo ✅
 * // error: Error | null ✅
 */
export interface PaginatedQueryResult<T> 
  extends Omit<UseQueryResult<T[], Error>, 'data'> {
  /**
   * Array of items from paginated response
   * undefined when loading or on error
   */
  data: T[] | undefined;
  
  /**
   * Pagination metadata
   * Present when using paginated endpoints
   */
  pagination: PaginationInfo | undefined;
}

/**
 * Result type for non-paginated queries
 * Used for single objects OR arrays without pagination
 * 
 * @example
 * // Single object
 * const { data, error } = useApi({
 *   queryFn: () => api.get<User>('/users/me')
 * });
 * // data: User | undefined ✅
 * 
 * @example
 * // Array without pagination
 * const { data, error } = useApi({
 *   queryFn: () => api.get<User[]>('/users')
 * });
 * // data: User[] | undefined ✅
 */
export interface SingleQueryResult<T> 
  extends Omit<UseQueryResult<T, Error>, 'data'> {
  /**
   * Query data (single object or array)
   * undefined when loading or on error
   */
  data: T | undefined;
  
  /**
   * Always undefined for non-paginated queries
   */
  pagination: undefined;
}