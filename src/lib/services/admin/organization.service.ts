import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { Organization } from "@/types/shared/organization.types";

export interface CreateOrganizationPayload {
  name: string;
  sector?: string;
  website?: string;
  about?: string;
  employeeRange?: string;
  emails?: string[];
  phoneNumbers?: string[];
  locations?: string[];
  socialLinks?: string[];
}

export interface OrgMember {
  uid: number;
  username: string;
  userslug: string;
  email: string;
  picture: string | null;
  memberships: Array<{
    membershipId: string;
    type: "member" | "manager" | "leader";
    status: string;
    joinedAt: number;
    department: { deptId: string; name: string } | null;
    role: { roleId: string; name: string } | null;
  }>;
}

export interface OrgMembersResponse {
  members: OrgMember[];
  page: number;
  pageCount: number;
  totalItems: number;
}

export interface OrgDepartment {
  deptId: string;
  organizationId: string;
  name: string;
  description: string;
  parentDepartmentId: string | null;
  level: number;
  state: string;
  timestamp: number;
  memberCount?: number;
}

export interface OrgDepartmentsResponse {
  departments: OrgDepartment[];
  page: number;
  pageCount: number;
  totalItems: number;
}

export interface OrgDepartmentMember {
  uid: number;
  username: string;
  userslug: string;
  email: string;
  picture: string | null;
}

export interface OrgDepartmentMembersResponse {
  members: OrgDepartmentMember[];
  page: number;
  pageCount: number;
  totalItems: number;
}

const BASE = "/v3/organizations";

export class AdminOrganizationService {
  static async list(params?: { page?: number; perPage?: number }): Promise<ApiResult<{ organizations: Organization[] }>> {
    return api.get<{ organizations: Organization[] }>(BASE, params);
  }
  static async search(query: string): Promise<ApiResult<Organization[]>> {
    return api.get<Organization[]>(`${BASE}/search`, { q: query });
  }
  static async get(orgId: string): Promise<ApiResult<Organization>> {
    return api.get<Organization>(`${BASE}/${orgId}`);
  }
  static async create(payload: CreateOrganizationPayload): Promise<ApiResult<Organization>> {
    return api.post<Organization>(BASE, payload);
  }
  static async update(orgId: string, payload: Partial<CreateOrganizationPayload>): Promise<ApiResult<Organization>> {
    return api.put<Organization>(`${BASE}/${orgId}`, payload);
  }
  static async delete(orgId: string): Promise<ApiResult<void>> {
    return api.delete<void>(`${BASE}/${orgId}`);
  }
  static async getMembers(orgId: string, params?: { page?: number; limit?: number }): Promise<ApiResult<OrgMembersResponse>> {
    return api.get<OrgMembersResponse>(`${BASE}/${orgId}/members`, params);
  }
  static async updateMember(orgId: string, uid: number, payload: { type?: string; departmentId?: string; status?: string }): Promise<ApiResult<unknown>> {
    return api.put(`${BASE}/${orgId}/members/${uid}`, payload);
  }
  static async addMember(orgId: string, uid: number, payload?: { type?: string }): Promise<ApiResult<unknown>> {
    return api.post(`${BASE}/${orgId}/members`, { uid, ...payload });
  }
  static async removeMember(orgId: string, uid: number): Promise<ApiResult<unknown>> {
    return api.delete(`${BASE}/${orgId}/members/${uid}`);
  }
  static async getDepartments(orgId: string, params?: { page?: number; limit?: number }): Promise<ApiResult<OrgDepartmentsResponse>> {
    return api.get<OrgDepartmentsResponse>(`${BASE}/${orgId}/departments`, params);
  }
  static async createDepartment(orgId: string, payload: { name: string; description?: string; parentDepartmentId?: string }): Promise<ApiResult<OrgDepartment>> {
    return api.post<OrgDepartment>(`${BASE}/${orgId}/departments`, payload);
  }
  static async deleteDepartment(orgId: string, deptId: string): Promise<ApiResult<void>> {
    return api.delete<void>(`${BASE}/${orgId}/departments/${deptId}`);
  }
  static async getDepartmentMembers(orgId: string, deptId: string, params?: { page?: number; limit?: number }): Promise<ApiResult<OrgDepartmentMembersResponse>> {
    return api.get<OrgDepartmentMembersResponse>(`${BASE}/${orgId}/departments/${deptId}/members`, params);
  }
}
