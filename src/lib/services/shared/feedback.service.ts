/**
 * FeedbackService — Shared service for all feedback directions.
 *
 * Handles L1↔L2, L1↔L3, L2↔L3, and peer feedback at every layer.
 * All methods are direction-key aware; the backend routes to the right
 * rubric and data based on directionKey.
 */

import { api } from "@/lib/api/client";
import type {
  FeedbackDirectionKey,
  FeedbackRubric,
  FeedbackTarget,
  FeedbackSubmission,
  FeedbackAggregate,
  FeedbackTargetDeliverable,
  FeedbackWeek,
  MemberScoringStatus,
  PendingScoringTarget,
  SubmitFeedbackPayload,
} from "@/types/shared/feedback.types";
import type { ApiResult } from "@/lib/api/client";
import type { BackendPaginatedResponse } from "@/types/shared/api.types";

interface ProgramScoringOverview {
  members: MemberScoringStatus[];
  averageComposite: number | null;
}

export class FeedbackService {
  // ════════════════════════════════════════════════════════════════════════════
  // READ — RUBRIC
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Fetch the active rubric for a direction.
   * Optionally scoped to a program.
   */
  static async getRubric(
    directionKey: FeedbackDirectionKey,
    programId?: string
  ): Promise<ApiResult<FeedbackRubric>> {
    return api.get<FeedbackRubric>(`/v3/pdgms/scoring/feedback/rubric`, { direction: directionKey, programId });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // READ — TARGETS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * List who the current user can give feedback to for a direction.
   * scopeId = deptId (for L2_TO_L1) or programId (for L3_TO_L1, L3_TO_L2, etc.)
   */
  static async getTargets(
    directionKey: FeedbackDirectionKey,
    scopeId?: string
  ): Promise<ApiResult<FeedbackTarget[]>> {
    return api.get<FeedbackTarget[]>(`/v3/pdgms/scoring/feedback/targets`, { directionKey, programId: scopeId });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // READ — HISTORY
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Get all submissions the current user has sent for a direction.
   */
  static async getHistory(
    directionKey: FeedbackDirectionKey,
    programId?: string
  ): Promise<ApiResult<BackendPaginatedResponse<FeedbackSubmission>>> {
    return api.get<BackendPaginatedResponse<FeedbackSubmission>>(`/v3/pdgms/scoring/feedback/history`, { directionKey, programId });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // READ — AGGREGATE (anonymous received)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Get the anonymous aggregate feedback the current user has received.
   * Only valid for anonymous directions (L1_TO_L2, L1_TO_L3).
   */
  static async getAggregate(
    directionKey: FeedbackDirectionKey,
    targetId: string,
    period?: string
  ): Promise<ApiResult<FeedbackAggregate>> {
    return api.get<FeedbackAggregate>(`/v3/pdgms/scoring/feedback/aggregates`, { directionKey, userId: targetId, period });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // READ — SCORING OVERVIEW (multi-member, L2/L3)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Get scoring status across all members in scope.
   * scopeId = deptId (for L2_TO_L1) or programId (for L3_TO_L1).
   */
  static async getScoringOverview(
    directionKey: FeedbackDirectionKey,
    scopeId: string
  ): Promise<ApiResult<ProgramScoringOverview>> {
    const isProgramDir = ["L3_TO_L1", "L3_TO_L2", "L2_TO_L3"].includes(directionKey);
    const subPath = isProgramDir ? "program" : "dept";
    const params = isProgramDir ? { directionKey, scopeId } : { directionKey, deptId: scopeId };
    return api.get<ProgramScoringOverview>(`/v3/pdgms/scoring/feedback/overview/${subPath}`, params);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // READ — PENDING (who the caller still owes a score this period) — G6
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Direct reports the caller has NOT scored this period (L2→L1).
   * scorerId defaults to the caller on the backend; periodId defaults to the
   * current week. Powers the pending-scoring nudge on the feedback page.
   */
  static async getPending(periodId?: string): Promise<ApiResult<PendingScoringTarget[]>> {
    return api.get<PendingScoringTarget[]>(`/v3/pdgms/scoring/feedback/pending`, { periodId });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WRITE — SUBMIT
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Submit feedback for a target.
   */
  static async submitFeedback(
    payload: SubmitFeedbackPayload
  ): Promise<ApiResult<{ success: boolean; composite: number }>> {
    return api.post(`/v3/pdgms/scoring/feedback/submit`, payload);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // READ — TARGET DELIVERABLES (Phase 3 context)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Fetch recent delivered tickets for a specific named target.
   * Used by named (non-anonymous) directions so the giver can evaluate in context.
   */
  static async getTargetDeliverables(
    targetId: string,
    period: string
  ): Promise<ApiResult<FeedbackTargetDeliverable[]>> {
    return api.get<FeedbackTargetDeliverable[]>(
      `/v3/pdgms/scoring/feedback/targets/${targetId}/deliverables`,
      { period }
    );
  }

  /**
   * Fetch recent delivered tickets for an anonymous scope (program or dept).
   * Used by anonymous directions (L1_TO_L2, L1_TO_L3) — shows team/program
   * aggregate deliverables without revealing individual identity.
   */
  static async getScopeDeliverables(
    directionKey: FeedbackDirectionKey,
    scopeId: string,
    period: string
  ): Promise<ApiResult<FeedbackTargetDeliverable[]>> {
    return api.get<FeedbackTargetDeliverable[]>(
      `/v3/pdgms/scoring/feedback/scope/deliverables`,
      { directionKey, scopeId, period }
    );
  }

  /** The target's daily plans + reports for one ISO week (weekly reflection evidence). */
  static async getTargetWeek(
    targetId: string,
    weekStart: string
  ): Promise<ApiResult<FeedbackWeek>> {
    return api.get<FeedbackWeek>(
      `/v3/pdgms/scoring/feedback/targets/${targetId}/week`,
      { weekStart }
    );
  }
}
