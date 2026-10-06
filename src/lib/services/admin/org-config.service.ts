import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  OrgConfig, UpdateIdentityPayload, UpdateLaddersPayload,
  UpdateWorkingDaysPayload, UpdateHealthWeightsPayload,
  UpdateNotificationsPayload, UpdateGoverningQuestionsPayload,
  UpdateScoringPayload, UpdateEnablersPayload, UpdateReportDeadlinesPayload,
  EscalationPolicy,
} from "@/types/admin";

const BASE = "/v3/pdgms";

export class OrgConfigService {
  static async get(): Promise<ApiResult<OrgConfig>> {
    return api.get<OrgConfig>(`${BASE}/infra/org-config`);
  }
  static async updateIdentity(payload: UpdateIdentityPayload): Promise<ApiResult<OrgConfig>> {
    return api.put<OrgConfig>(`${BASE}/infra/org-config/identity`, payload);
  }
  static async updateLadders(payload: UpdateLaddersPayload): Promise<ApiResult<OrgConfig>> {
    return api.put<OrgConfig>(`${BASE}/infra/org-config/ladders`, payload);
  }
  static async updateWorkingDays(payload: UpdateWorkingDaysPayload): Promise<ApiResult<OrgConfig>> {
    return api.put<OrgConfig>(`${BASE}/infra/org-config/working-days`, payload);
  }
  static async updateHealthWeights(payload: UpdateHealthWeightsPayload): Promise<ApiResult<OrgConfig>> {
    return api.put<OrgConfig>(`${BASE}/infra/org-config/health-weights`, payload);
  }
  static async updateNotifications(payload: UpdateNotificationsPayload): Promise<ApiResult<OrgConfig>> {
    return api.put<OrgConfig>(`${BASE}/infra/org-config/notifications`, payload);
  }
  static async updateGoverningQuestions(payload: UpdateGoverningQuestionsPayload): Promise<ApiResult<OrgConfig>> {
    return api.put<OrgConfig>(`${BASE}/infra/org-config/governing-questions`, payload);
  }
  static async updateScoring(payload: UpdateScoringPayload): Promise<ApiResult<OrgConfig>> {
    return api.put<OrgConfig>(`${BASE}/infra/org-config/scoring`, payload);
  }
  static async updateEnablers(payload: UpdateEnablersPayload): Promise<ApiResult<OrgConfig>> {
    return api.put<OrgConfig>(`${BASE}/infra/org-config/enablers`, payload);
  }
  static async updateReportDeadlines(payload: UpdateReportDeadlinesPayload): Promise<ApiResult<OrgConfig>> {
    return api.patch<OrgConfig>(`${BASE}/infra/org-config/report-deadlines`, payload);
  }
  static async updateEscalationPolicy(payload: { escalationPolicy: EscalationPolicy }): Promise<ApiResult<OrgConfig>> {
    return api.put<OrgConfig>(`${BASE}/infra/org-config/escalation-policy`, payload);
  }
}
