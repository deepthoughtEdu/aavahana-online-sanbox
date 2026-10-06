import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  ByokGroup,
  CreateByokGroupPayload,
  UpdateByokGroupPayload,
  AddGroupMemberPayload,
} from "@/types/admin";

const BASE = "/v3/pdgms/ai/byok/groups";

export class ByokGroupsService {
  static async list(): Promise<ApiResult<ByokGroup[]>> {
    return api.get<ByokGroup[]>(BASE);
  }

  static async get(id: number): Promise<ApiResult<ByokGroup>> {
    return api.get<ByokGroup>(`${BASE}/${id}`);
  }

  static async create(payload: CreateByokGroupPayload): Promise<ApiResult<ByokGroup>> {
    return api.post<ByokGroup>(BASE, payload);
  }

  static async update(id: number, payload: UpdateByokGroupPayload): Promise<ApiResult<ByokGroup>> {
    return api.put<ByokGroup>(`${BASE}/${id}`, payload);
  }

  static async deactivate(id: number): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`${BASE}/${id}`);
  }

  static async addMember(id: number, payload: AddGroupMemberPayload): Promise<ApiResult<ByokGroup>> {
    return api.post<ByokGroup>(`${BASE}/${id}/members`, payload);
  }

  static async removeMember(id: number, userId: string): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`${BASE}/${id}/members/${userId}`);
  }
}
