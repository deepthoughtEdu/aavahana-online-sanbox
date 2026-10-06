import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  AssessmentInstanceResponse,
  FindOrCreatePayload,
  FindOrCreateResult,
  SubmitResponsePayload,
} from "@/types/assessments/assessment.types";

const BASE = "/v3/pdgms/assessments";

export class AssessmentService {
  static async findOrCreate(
    payload: FindOrCreatePayload
  ): Promise<ApiResult<FindOrCreateResult>> {
    return api.post<FindOrCreateResult>(BASE, payload);
  }

  static async submitResponse(
    instanceId: number,
    payload: SubmitResponsePayload
  ): Promise<ApiResult<unknown>> {
    return api.post(`${BASE}/${instanceId}/responses`, payload);
  }

  static async getInstance(
    instanceId: number
  ): Promise<ApiResult<AssessmentInstanceResponse>> {
    return api.get<AssessmentInstanceResponse>(`${BASE}/${instanceId}`);
  }

  static async listMine(params?: {
    schemaKey?: string;
    contextType?: string;
  }): Promise<ApiResult<AssessmentInstanceResponse[]>> {
    const query = new URLSearchParams();
    if (params?.schemaKey) query.set("schemaKey", params.schemaKey);
    if (params?.contextType) query.set("contextType", params.contextType);
    const qs = query.toString();
    return api.get<AssessmentInstanceResponse[]>(
      `${BASE}/mine${qs ? `?${qs}` : ""}`
    );
  }

  static async score(
    instanceId: number
  ): Promise<ApiResult<AssessmentInstanceResponse>> {
    return api.post<AssessmentInstanceResponse>(`${BASE}/${instanceId}/score`);
  }
}
