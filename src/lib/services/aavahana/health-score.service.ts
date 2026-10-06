import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { HealthScore } from "@/types/mimamsaka/scoring.types";

export class HealthScoreService {
  /** Get computed health score for a user */
  static async getHealthScore(userId: string): Promise<ApiResult<HealthScore>> {
    return api.get<HealthScore>(`/v3/pdgms/scoring/health-score/${userId}`);
  }

  /** Trigger health score computation (admin/system) */
  static async computeHealthScore(userId: string, weekId: string): Promise<ApiResult<HealthScore>> {
    return api.post<HealthScore>("/v3/pdgms/scoring/health-score/compute", { userId, weekId });
  }
}
