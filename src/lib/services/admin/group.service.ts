import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  OrgGroup,
  GroupMemberSummary,
  CreateGroupPayload,
  UpdateGroupPayload,
} from "@/types/admin";

const BASE = "/v3/pdgms/groups";

export class GroupService {
  static async list(): Promise<ApiResult<OrgGroup[]>> {
    return api.get<OrgGroup[]>(BASE);
  }

  static async get(groupId: number): Promise<ApiResult<OrgGroup>> {
    return api.get<OrgGroup>(`${BASE}/${groupId}`);
  }

  static async create(payload: CreateGroupPayload): Promise<ApiResult<OrgGroup>> {
    return api.post<OrgGroup>(BASE, payload);
  }

  static async update(groupId: number, payload: UpdateGroupPayload): Promise<ApiResult<OrgGroup>> {
    return api.put<OrgGroup>(`${BASE}/${groupId}`, payload);
  }

  static async deactivate(groupId: number): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`${BASE}/${groupId}`);
  }

  static async getMembers(groupId: number): Promise<ApiResult<GroupMemberSummary[]>> {
    return api.get<GroupMemberSummary[]>(`${BASE}/${groupId}/members`);
  }
}
