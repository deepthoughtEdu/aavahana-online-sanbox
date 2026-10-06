import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { GroupPrivilege, GrantPrivilegePayload } from "@/types/admin";

const BASE = "/v3/pdgms/groups";

export class GroupPrivilegeService {
  static async list(groupId: number): Promise<ApiResult<GroupPrivilege[]>> {
    return api.get<GroupPrivilege[]>(`${BASE}/${groupId}/privileges`);
  }

  static async grant(groupId: number, payload: GrantPrivilegePayload): Promise<ApiResult<GroupPrivilege>> {
    return api.post<GroupPrivilege>(`${BASE}/${groupId}/privileges`, payload);
  }

  static async revoke(groupId: number, userId: string): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`${BASE}/${groupId}/privileges/${userId}`);
  }
}
