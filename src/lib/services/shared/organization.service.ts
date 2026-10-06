import { api, ApiResult } from '@/lib/api/client';
import { Member, PaginatedResponseWrapper, PaginationParams, User } from '@/types';

/**
 * ============================================
 * ORGANIZATION SERVICE
 * ============================================
 *
 * All methods use api client with built-in:
 * - ✅ Error handling (returns ApiResult<T>)
 * - ✅ Performance tracking
 * - ✅ Logging
 * - ✅ Toast notifications (configurable)
 * - ✅ Rate limiting protection
 *
 * @example
 * const result = await OrganizationService.getMembers();
 * if (isError(result)) {
 *   setError(result.error.message);
 *   return;
 * }
 * setMembers(result.data);
 */
export class OrganizationService {
  /**
   * ============================================
   * MEMBERS
   * ============================================
   */

  /**
   * Get organization members with pagination
   *
   * @param params - Optional pagination parameters (page, limit, sort, etc.)
   * @returns Paginated list of organization members
   *
   * @example
   * // ✅ With useApi hook
   * const { data: members, pagination } = useApi({
   *   queryFn: () => OrganizationService.getMembers({ page: 1, limit: 20 })
   * });
   * // members: Member[] | undefined
   * // pagination: PaginationInfo | undefined
   */
  static async getMembers(
    params?: PaginationParams
  ): Promise<ApiResult<PaginatedResponseWrapper<Member>>> {
    return await api.get<PaginatedResponseWrapper<Member>>(
      '/v3/organizations/:organizationId/members',
      params,
      {
        label: 'Get Organization Members',
        toast: false,
      }
    );
  }

  /**
   * Get managers for leave approval
   * Returns up to 150 managers with populated user and role data
   *
   * @returns Paginated list of managers with user details
   *
   * @example
   * // ✅ With useApi hook
   * const { data: managers } = useApi({
   *   queryFn: OrganizationService.getManagers
   * });
   *
   * // Map to options for select dropdown
   * const managerOptions = managers?.map(m => ({
   *   value: m.user.uid,
   *   label: m.user.fullname || m.user.username
   * }));
   */
  static async getManagers(): Promise<ApiResult<PaginatedResponseWrapper<{ user: User }>>> {
    return await api.get<PaginatedResponseWrapper<{ user: User }>>(
      '/v3/organizations/:organizationId/managers',
      {
        populate: 'user,role',
        limit: 150,
      },
      {
        label: 'Get Organization Managers',
        toast: false,
      }
    );
  }

  /**
   * ============================================
   * MEMBER DETAILS
   * ============================================
   */

  /**
   * Get single member details by ID
   *
   * @param memberId - The member ID to fetch
   * @returns Member details with populated relations
   *
   * @example
   * // ✅ With useApi hook
   * const { data: member, isLoading } = useApi({
   *   queryFn: () => OrganizationService.getMemberById(memberId),
   *   queryKey: ['member', memberId]
   * });
   *
   * if (!member && !isLoading) {
   *   router.push('/404');
   * }
   */
  static async getMemberById(memberId: string): Promise<ApiResult<Member>> {
    return await api.get<Member>(
      `/v3/organizations/:organizationId/members/${memberId}`,
      undefined,
      {
        label: 'Get Member Details',
        toast: false,
      }
    );
  }

  /**
   * ============================================
   * SEARCH & FILTER
   * ============================================
   */

  /**
   * Search members by query
   *
   * @param query - Search query (name, email, username, etc.)
   * @param params - Optional pagination parameters
   * @returns Paginated search results
   *
   * @example
   * // ✅ With useApi hook
   * const { data: searchResults } = useApi({
   *   queryFn: () => OrganizationService.searchMembers(searchQuery, { limit: 10 }),
   *   queryKey: ['members', 'search', searchQuery],
   *   enabled: searchQuery.length > 2
   * });
   */
  static async searchMembers(
    query: string,
    params?: PaginationParams
  ): Promise<ApiResult<PaginatedResponseWrapper<Member>>> {
    return await api.get<PaginatedResponseWrapper<Member>>(
      '/v3/organizations/:organizationId/members/search',
      {
        ...params,
        q: query,
      },
      {
        label: 'Search Members',
        toast: false,
        log: false,
      }
    );
  }

  /**
   * Filter members by role
   *
   * @param role - Role to filter by
   * @param params - Optional pagination parameters
   * @returns Paginated list of members with specified role
   *
   * @example
   * // ✅ With useApi hook
   * const { data: admins } = useApi({
   *   queryFn: () => OrganizationService.getMembersByRole('admin'),
   *   queryKey: ['members', 'role', 'admin']
   * });
   */
  static async getMembersByRole(
    role: string,
    params?: PaginationParams
  ): Promise<ApiResult<PaginatedResponseWrapper<Member>>> {
    return await api.get<PaginatedResponseWrapper<Member>>(
      '/v3/organizations/:organizationId/members',
      {
        ...params,
        role,
      },
      {
        label: 'Get Members by Role',
        toast: false,
      }
    );
  }
}
