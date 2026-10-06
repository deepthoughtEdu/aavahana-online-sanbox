/**
 * HVT Service — API integration for High-Value Test (micro-experimentation engine)
 *
 * Shared between Mimamsaka (L3) and Aavahana (L1/L2).
 * Role-based middleware on backend controls access.
 */

import { api, ApiResult } from "@/lib/api/client";
import type {
  HVTExperiment,
  HVTExplorerOverview,
  HVTFilterParams,
  HVTTimelineEntry,
  ProgramHVTSummary,
  SprintExperimentSlot,
  ExperimentIdea,
  MyProgramsHVTOverview,
  MyIdeasListItem,
  TeamHVTSummary,
  CreateExperimentPayload,
  UpdateExperimentPayload,
  ConcludeExperimentPayload,
  CancelExperimentPayload,
  LinkToIpPayload,
  SubmitIdeaPayload,
  ReviewIdeaPayload,
  IdeaStatus,
} from "@/types/shared/hvt.types";

export class HVTService {
  // ════════════════════════════════════════════════════════════════════════════
  // L3 — READ ENDPOINTS
  // ════════════════════════════════════════════════════════════════════════════

  /** Cross-program HVT overview (L3 only) */
  static async getExplorerOverview(): Promise<ApiResult<HVTExplorerOverview>> {
    return api.get<HVTExplorerOverview>("/v3/pdgms/program/hvt/explorer");
  }

  /** List experiments with filters + pagination */
  static async getExperiments(
    params?: HVTFilterParams
  ): Promise<ApiResult<HVTExperiment[]>> {
    return api.get<HVTExperiment[]>("/v3/pdgms/program/hvt/experiments", params as Record<string, unknown> | undefined);
  }

  /** Single experiment detail */
  static async getExperiment(id: string): Promise<ApiResult<HVTExperiment>> {
    return api.get<HVTExperiment>(`/v3/pdgms/program/hvt/experiments/${id}`);
  }

  /** Program-level HVT summary (L3) */
  static async getProgramSummary(
    programId: string
  ): Promise<ApiResult<ProgramHVTSummary>> {
    return api.get<ProgramHVTSummary>(`/v3/pdgms/program/hvt/programs/${programId}/summary`);
  }

  /** Sprint-level experiment slots for planning (L3) */
  static async getSprintSlots(
    programId: string
  ): Promise<ApiResult<SprintExperimentSlot[]>> {
    return api.get<SprintExperimentSlot[]>(`/v3/pdgms/program/hvt/programs/${programId}/sprints`);
  }

  /** Ideas submitted for a program (L3 review) */
  static async getProgramIdeas(
    programId: string,
    status?: IdeaStatus
  ): Promise<ApiResult<ExperimentIdea[]>> {
    return api.get<ExperimentIdea[]>(`/v3/pdgms/program/hvt/programs/${programId}/ideas`, { status });
  }

  /** Chronological experiment events (L3) */
  static async getTimeline(params?: {
    programId?: string;
    from?: string;
    to?: string;
  }): Promise<ApiResult<HVTTimelineEntry[]>> {
    return api.get<HVTTimelineEntry[]>("/v3/pdgms/program/hvt/timeline", params);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // L3 — WRITE ENDPOINTS
  // ════════════════════════════════════════════════════════════════════════════

  /** Create new experiment (L3) */
  static async createExperiment(
    payload: CreateExperimentPayload
  ): Promise<ApiResult<HVTExperiment>> {
    return api.post<HVTExperiment>("/v3/pdgms/program/hvt/experiments", payload);
  }

  /** Update experiment fields (L3) */
  static async updateExperiment(
    id: string,
    payload: UpdateExperimentPayload
  ): Promise<ApiResult<HVTExperiment>> {
    return api.patch<HVTExperiment>(`/v3/pdgms/program/hvt/experiments/${id}`, payload);
  }

  /** Start experiment — move to "running" (L3) */
  static async startExperiment(id: string): Promise<ApiResult<HVTExperiment>> {
    return api.post<HVTExperiment>(`/v3/pdgms/program/hvt/experiments/${id}/start`, { experimentId: id });
  }

  /** Conclude experiment with results + learning (L3) */
  static async concludeExperiment(
    payload: ConcludeExperimentPayload
  ): Promise<ApiResult<HVTExperiment>> {
    return api.post<HVTExperiment>(`/v3/pdgms/program/hvt/experiments/${payload.experimentId}/conclude`, payload);
  }

  /** Cancel experiment (L3) */
  static async cancelExperiment(
    payload: CancelExperimentPayload
  ): Promise<ApiResult<HVTExperiment>> {
    return api.post<HVTExperiment>(`/v3/pdgms/program/hvt/experiments/${payload.experimentId}/cancel`, payload);
  }

  /** Link concluded experiment to IP item (L3) */
  static async linkToIp(
    payload: LinkToIpPayload
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.post<{ success: boolean }>(`/v3/pdgms/program/hvt/experiments/${payload.experimentId}/link-ip`, payload);
  }

  /** Delete experiment — only if status is idea or planned (L3) */
  static async deleteExperiment(
    id: string
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`/v3/pdgms/program/hvt/experiments/${id}`);
  }

  /** Review an idea — accept or reject (L3) */
  static async reviewIdea(
    payload: ReviewIdeaPayload
  ): Promise<ApiResult<ExperimentIdea>> {
    return api.post<ExperimentIdea>(`/v3/pdgms/program/hvt/ideas/${payload.ideaId}/review`, payload);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // L1/L2 — READ ENDPOINTS
  // ════════════════════════════════════════════════════════════════════════════

  /** Overview of HVTs in user's programs (L1/L2) */
  static async getMyProgramsOverview(): Promise<ApiResult<MyProgramsHVTOverview>> {
    return api.get<MyProgramsHVTOverview>("/v3/pdgms/program/hvt/my-programs");
  }

  /** List user's submitted ideas (L1/L2) */
  static async getMyIdeas(): Promise<ApiResult<MyIdeasListItem[]>> {
    return api.get<MyIdeasListItem[]>("/v3/pdgms/program/hvt/ideas/mine");
  }

  /** Get single idea detail (own ideas for L1/L2, any for L3) */
  static async getIdea(ideaId: string): Promise<ApiResult<ExperimentIdea>> {
    return api.get<ExperimentIdea>(`/v3/pdgms/program/hvt/ideas/${ideaId}`);
  }

  /** Submit experiment idea (L1/L2) */
  static async submitIdea(
    payload: SubmitIdeaPayload
  ): Promise<ApiResult<ExperimentIdea>> {
    return api.post<ExperimentIdea>("/v3/pdgms/program/hvt/ideas", payload);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // L2 — TEAM SUMMARY
  // ════════════════════════════════════════════════════════════════════════════

  /** Experiment summary across direct reports' programs (L2 only) */
  static async getTeamSummary(): Promise<ApiResult<TeamHVTSummary[]>> {
    return api.get<TeamHVTSummary[]>("/v3/pdgms/program/hvt/team-summary");
  }
}
