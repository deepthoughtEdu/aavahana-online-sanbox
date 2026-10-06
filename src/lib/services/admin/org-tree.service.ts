import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  OrgTreeNode, OrgTreeResponse, SupervisorChainResponse,
  UpsertNodePayload, MoveNodePayload, BulkUpsertPayload,
} from "@/types/admin";

const BASE = "/v3/pdgms/people/org-tree";

export class OrgTreeService {
  static async getTree(): Promise<ApiResult<OrgTreeResponse>> {
    return api.get<OrgTreeResponse>(BASE);
  }

  static async getNode(eid: number): Promise<ApiResult<OrgTreeNode>> {
    return api.get<OrgTreeNode>(`${BASE}/${eid}`);
  }

  static async getDirectReports(eid: number): Promise<ApiResult<OrgTreeResponse>> {
    return api.get<OrgTreeResponse>(`${BASE}/${eid}/direct-reports`);
  }

  static async getSupervisorChain(eid: number): Promise<ApiResult<SupervisorChainResponse>> {
    return api.get<SupervisorChainResponse>(`${BASE}/${eid}/chain`);
  }

  static async upsertNode(payload: UpsertNodePayload): Promise<ApiResult<OrgTreeNode>> {
    return api.put<OrgTreeNode>(BASE, payload);
  }

  static async moveNode(eid: number, payload: MoveNodePayload): Promise<ApiResult<OrgTreeNode>> {
    return api.patch<OrgTreeNode>(`${BASE}/${eid}/move`, payload);
  }

  static async archiveNode(eid: number): Promise<ApiResult<{ archived: boolean }>> {
    return api.post<{ archived: boolean }>(`${BASE}/${eid}/archive`);
  }

  static async bulkUpsert(payload: BulkUpsertPayload): Promise<ApiResult<{ upserted: number }>> {
    return api.post<{ upserted: number }>(`${BASE}/bulk`, payload);
  }
}
