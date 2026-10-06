import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { PeopleListResponse, PeopleListParams } from "@/types/admin";
import type { OrgTreeNode } from "@/types/admin";

const BASE = "/v3/pdgms/people/directory";

export class PeopleService {
  static async listAll(params?: PeopleListParams): Promise<ApiResult<PeopleListResponse>> {
    return api.get<PeopleListResponse>(BASE, params);
  }

  static async offboard(eid: number): Promise<ApiResult<{ orgId: string; eid: number; uid: string }>> {
    return api.post<{ orgId: string; eid: number; uid: string }>(`${BASE}/${eid}/offboard`);
  }

  static async toggleSupervisor(eid: number): Promise<ApiResult<OrgTreeNode>> {
    return api.post<OrgTreeNode>(`${BASE}/${eid}/toggle-supervisor`);
  }
}
