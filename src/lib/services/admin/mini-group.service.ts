import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  OrgMiniGroup,
  OrgMiniGroupMember,
  CreateMiniGroupPayload,
  UpdateMiniGroupPayload,
  AddMiniGroupMemberPayload,
} from "@/types/admin";

const BASE = "/v3/pdgms/groups";

export class MiniGroupService {
  static async list(groupId: number): Promise<ApiResult<OrgMiniGroup[]>> {
    return api.get<OrgMiniGroup[]>(`${BASE}/${groupId}/mini-groups`);
  }

  static async get(groupId: number, miniGroupId: number): Promise<ApiResult<OrgMiniGroup>> {
    return api.get<OrgMiniGroup>(`${BASE}/${groupId}/mini-groups/${miniGroupId}`);
  }

  static async create(groupId: number, payload: CreateMiniGroupPayload): Promise<ApiResult<OrgMiniGroup>> {
    return api.post<OrgMiniGroup>(`${BASE}/${groupId}/mini-groups`, payload);
  }

  static async update(groupId: number, miniGroupId: number, payload: UpdateMiniGroupPayload): Promise<ApiResult<OrgMiniGroup>> {
    return api.put<OrgMiniGroup>(`${BASE}/${groupId}/mini-groups/${miniGroupId}`, payload);
  }

  static async deactivate(groupId: number, miniGroupId: number): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`${BASE}/${groupId}/mini-groups/${miniGroupId}`);
  }

  static async addMember(groupId: number, miniGroupId: number, payload: AddMiniGroupMemberPayload): Promise<ApiResult<OrgMiniGroupMember>> {
    return api.post<OrgMiniGroupMember>(`${BASE}/${groupId}/mini-groups/${miniGroupId}/members`, payload);
  }

  static async removeMember(groupId: number, miniGroupId: number, userId: string): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`${BASE}/${groupId}/mini-groups/${miniGroupId}/members/${userId}`);
  }
}
