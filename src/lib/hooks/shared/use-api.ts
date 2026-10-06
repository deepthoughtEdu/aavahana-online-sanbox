// src/lib/hooks/use-api.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions as TanStackUseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from "@tanstack/react-query";
import {
  ApiResult,
  isError,
} from "@/lib/api/client";
import { queryClient } from "@/lib/query/client";
import {
  PaginatedResponseWrapper,
  PaginatedQueryResult,
  SingleQueryResult,
} from "@/types";
import { getFunctionSignature } from "@/utils";

/**
 * ============================================
 * TYPE UTILITIES
 * ============================================
 */

/**
 * Infer the data type from a queryFn
 * Handles both direct return types and Promise-wrapped types
 */
type InferQueryFnData<T> = T extends () => Promise<ApiResult<infer U>>
  ? U
  : T extends () => ApiResult<infer U>
  ? U
  : never;

/**
 * ============================================
 * HOOK OPTIONS
 * ============================================
 */

/**
 * Options for useApi hook - with automatic type inference
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic type parameter needed for flexible queryFn inference
export interface UseApiOptions<TQueryFn extends () => Promise<ApiResult<any>>, TError = Error>
  extends Omit<TanStackUseQueryOptions<InferQueryFnData<TQueryFn>, TError>, 'queryFn' | 'queryKey'> {
  queryKey?: QueryKey;
  queryFn: TQueryFn;
}

export interface UseApiMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<ApiResult<TData>>;
}

/**
 * ============================================
 * PAGINATION UTILITIES
 * ============================================
 */

/**
 * Detect PDGMS backend pagination: { items: T[], total, page, perPage }
 * (from helpers.paginatedResponse())
 */
function isBackendPaginatedResponse(data: unknown): data is { items: unknown[]; total: number; page: number; perPage: number } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    'total' in data &&
    Array.isArray((data as { items: unknown }).items)
  );
}

/**
 * Detect legacy/org pagination: { data: T[], pagination: PaginationInfo }
 * (from organization endpoints)
 */
function isLegacyPaginatedResponse<T>(data: unknown): data is PaginatedResponseWrapper<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    'pagination' in data &&
    Array.isArray((data as PaginatedResponseWrapper<T>).data) &&
    typeof (data as PaginatedResponseWrapper<T>).pagination === 'object'
  );
}

/**
 * ============================================
 * MAIN HOOK - useApi (OVERLOADS)
 * ============================================
 */

/**
 * React Query hook for API calls with automatic error handling
 * 
 * **Type inference is now automatic!**
 * The hook infers the return type from your service method - no generic needed!
 * 
 * **API Response States:**
 * 1. Single object: `{ response: T }` → returns `data: T | undefined`
 * 2. Array (no pagination): `{ response: T[] }` → returns `data: T[] | undefined, pagination: undefined`
 * 3. Paginated array: `{ response: { data: T[], pagination } }` → returns `data: T[] | undefined, pagination: PaginationInfo`
 * 
 * @example
 * // ✅ Type automatically inferred from AuthService.me()
 * const { data } = useApi({
 *   queryFn: AuthService.me
 * });
 * // data: { user: User } | undefined
 * 
 * @example
 * // ✅ Paginated - automatically extracts data array
 * const { data, pagination } = useApi({
 *   queryFn: () => LeaveService.getAppliedLeaves({ page: 1 })
 * });
 * // data: Leave[] | undefined
 * // pagination: PaginationInfo | undefined
 * 
 * @example
 * // ✅ Array without pagination
 * const { data } = useApi({
 *   queryFn: LeaveService.getHolidays
 * });
 * // data: Holiday[] | undefined
 */

// Overload 1: Paginated response wrapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for generic overload pattern to match all paginated responses
export function useApi<TQueryFn extends () => Promise<ApiResult<PaginatedResponseWrapper<any>>>>(
  options: UseApiOptions<TQueryFn>
): PaginatedQueryResult<InferQueryFnData<TQueryFn> extends PaginatedResponseWrapper<infer U> ? U : never>;

// Overload 2: Array without pagination
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for generic overload pattern to match all array responses
export function useApi<TQueryFn extends () => Promise<ApiResult<any[]>>>(
  options: UseApiOptions<TQueryFn>
): SingleQueryResult<InferQueryFnData<TQueryFn>>;

// Overload 3: Single object or any other type
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for generic overload to accept all possible ApiResult response types
export function useApi<TQueryFn extends () => Promise<ApiResult<any>>>(
  options: UseApiOptions<TQueryFn>
   
): InferQueryFnData<TQueryFn> extends PaginatedResponseWrapper<infer U>
  ? PaginatedQueryResult<U>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required to match array types in conditional
  : InferQueryFnData<TQueryFn> extends any[]
  ? SingleQueryResult<InferQueryFnData<TQueryFn>>
  : SingleQueryResult<InferQueryFnData<TQueryFn>>;

// Implementation
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Implementation must handle all possible types from overloads above
export function useApi<TQueryFn extends () => Promise<ApiResult<any>>>(
  options: UseApiOptions<TQueryFn>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Return type union covers all overload cases
): PaginatedQueryResult<any> | SingleQueryResult<any> {
  const { queryFn, queryKey, ...reactQueryOptions } = options;

  type TData = InferQueryFnData<TQueryFn>;

  const wrappedQueryFn = async (): Promise<TData> => {
    const result = await queryFn();

    if (isError(result)) {
      throw result.error;
    }

    return result as TData;
  };

  const queryResult = useQuery<TData, Error>({
    queryKey: queryKey || [getFunctionSignature(queryFn)],
    queryFn: wrappedQueryFn,
    // Never retry client errors (4xx) or already-rate-limited responses: they
    // cannot succeed on retry, so retrying only multiplies requests (a single
    // 404 became 3 calls) and trips our own rate limiter. Retry only transient
    // failures (network / 5xx). Callers can still override via options below.
    retry: (failureCount, error) => {
      const err = error as { status?: number; rateLimited?: boolean } | null | undefined;
      if (err?.rateLimited) return false;
      if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) return false;
      return failureCount < 2;
    },
    ...reactQueryOptions,
  });

  // Check for PDGMS backend pagination: { items, total, page, perPage }
  if (queryResult.data && isBackendPaginatedResponse(queryResult.data)) {
    const { items, total, page, perPage } = queryResult.data;
    return {
      ...queryResult,
      data: items,
      pagination: {
        currentPage: page,
        pageCount: Math.ceil(total / (perPage || 1)),
        prev:  { page: Math.max(1, page - 1), active: page > 1 },
        next:  { page: page + 1, active: page * perPage < total },
        first: { page: 1, active: page > 1 },
        last:  { page: Math.ceil(total / (perPage || 1)), active: page * perPage < total },
        rel:   [],
        pages: [],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Return type matches PaginatedQueryResult from overload
    } as PaginatedQueryResult<any>;
  }

  // Check for legacy/org pagination: { data, pagination }
  if (queryResult.data && isLegacyPaginatedResponse(queryResult.data)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Runtime type validated by isLegacyPaginatedResponse guard
    const paginatedData = queryResult.data as PaginatedResponseWrapper<any>;
    return {
      ...queryResult,
      data: paginatedData.data,
      pagination: paginatedData.pagination,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Return type matches PaginatedQueryResult from overload
    } as PaginatedQueryResult<any>;
  }

  // Non-paginated: single object or plain array
  return {
    ...queryResult,
    pagination: undefined,
  } as SingleQueryResult<TData>;
}

/**
 * ============================================
 * MUTATION HOOK - useApiMutation
 * ============================================
 */

/**
 * React Query mutation hook with automatic type inference
 * 
 * @example
 * // ✅ Types automatically inferred from LeaveService.applyLeave
 * const mutation = useApiMutation({
 *   mutationFn: LeaveService.applyLeave,
 *   onSuccess: (data) => {
 *     // data is { success: boolean; message: string }
 *     toast.success(data.message);
 *   }
 * });
 * 
 * // TypeScript knows the payload type
 * mutation.mutate({
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-05',
 *   // ...
 * });
 */
export function useApiMutation<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic constraint must accept any mutation function signature
  TMutationFn extends (variables: any) => Promise<ApiResult<any>>
>(
  options: Omit<
    UseApiMutationOptions<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type inference pattern for extracting return type
      TMutationFn extends (variables: any) => Promise<ApiResult<infer U>> ? U : never,
      Parameters<TMutationFn>[0]
    >,
    'mutationFn'
  > & {
    mutationFn: TMutationFn;
    /**
     * Query keys to invalidate on successful mutation. Saves consumers from
     * importing `queryClient` directly — the wrapper fires invalidation
     * BEFORE the caller's own `onSuccess`, so caller-side onSuccess can
     * still read the fresh data via refetch.
     */
    invalidateKeys?: QueryKey[];
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type inference from generic TMutationFn parameter
  type TData = TMutationFn extends (variables: any) => Promise<ApiResult<infer U>> ? U : never;
  type TVariables = Parameters<TMutationFn>[0];

  const { mutationFn, invalidateKeys, onSuccess: callerOnSuccess, ...reactQueryOptions } = options;

  const wrappedMutationFn = async (variables: TVariables): Promise<TData> => {
    const result = await mutationFn(variables);

    if (isError(result)) {
      throw result.error;
    }

    return result as TData;
  };

  return useMutation<TData, Error, TVariables>({
    mutationFn: wrappedMutationFn,
    ...reactQueryOptions,
    onSuccess: (...args: Parameters<NonNullable<typeof callerOnSuccess>>) => {
      if (invalidateKeys?.length) {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
      callerOnSuccess?.(...args);
    },
  });
}

export type {
  PaginatedQueryResult,
  SingleQueryResult,
};