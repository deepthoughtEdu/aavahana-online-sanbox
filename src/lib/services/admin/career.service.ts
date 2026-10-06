import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { CareerPlan, SetCareerPlanPayload } from "@/types/admin";

const BASE = "/v3/pdgms";

export class CareerService {
  static async setPlan(userId: string, payload: SetCareerPlanPayload): Promise<ApiResult<CareerPlan>> {
    return api.put<CareerPlan>(`${BASE}/scoring/career/${userId}/plan`, payload);
  }
  static async getPlan(userId: string): Promise<ApiResult<CareerPlan>> {
    return api.get<CareerPlan>(`${BASE}/scoring/career/${userId}/plan`);
  }
}
