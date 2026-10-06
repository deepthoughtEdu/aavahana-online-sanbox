/**
 * HVT Hooks — TanStack Query hooks for High-Value Test data
 *
 * Shared between Mimamsaka (L3) and Aavahana (L1/L2).
 */

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { HVTService } from "@/lib/services/shared/hvt.service";
import { queryClient } from "@/lib/query/client";
import { notify } from "@/utils/shared/toast.utils";
import type {
  HVTFilterParams,
  CreateExperimentPayload,
  UpdateExperimentPayload,
  ConcludeExperimentPayload,
  CancelExperimentPayload,
  LinkToIpPayload,
  SubmitIdeaPayload,
  ReviewIdeaPayload,
  IdeaStatus,
} from "@/types/shared/hvt.types";

// ════════════════════════════════════════════════════════════════════════════════
// L3 — READ HOOKS
// ════════════════════════════════════════════════════════════════════════════════

/** Cross-program HVT overview (L3 Explorer) */
export function useHVTExplorerOverview() {
  return useApi({
    queryKey: ["hvt", "explorer"],
    queryFn: () => HVTService.getExplorerOverview(),
  });
}

/** List experiments with filters + pagination */
export function useHVTExperiments(params?: HVTFilterParams, enabled = true) {
  return useApi({
    queryKey: ["hvt", "experiments", params],
    queryFn: () => HVTService.getExperiments(params),
    enabled,
  });
}

/** Single experiment detail */
export function useHVTExperiment(id: string) {
  return useApi({
    queryKey: ["hvt", "experiments", id],
    queryFn: () => HVTService.getExperiment(id),
    enabled: !!id,
  });
}

/** Program-level HVT summary */
export function useHVTProgramSummary(programId: string) {
  return useApi({
    queryKey: ["hvt", "program-summary", programId],
    queryFn: () => HVTService.getProgramSummary(programId),
    enabled: !!programId,
  });
}

/** Sprint experiment slots for planning */
export function useHVTSprintSlots(programId: string) {
  return useApi({
    queryKey: ["hvt", "sprint-slots", programId],
    queryFn: () => HVTService.getSprintSlots(programId),
    enabled: !!programId,
  });
}

/** Ideas submitted for a program (L3 review inbox) */
export function useHVTProgramIdeas(programId: string, status?: IdeaStatus) {
  return useApi({
    queryKey: ["hvt", "program-ideas", programId, status],
    queryFn: () => HVTService.getProgramIdeas(programId, status),
    enabled: !!programId,
  });
}

/** Chronological experiment events */
export function useHVTTimeline(params?: {
  programId?: string;
  from?: string;
  to?: string;
}) {
  return useApi({
    queryKey: ["hvt", "timeline", params],
    queryFn: () => HVTService.getTimeline(params),
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// L3 — MUTATION HOOKS
// ════════════════════════════════════════════════════════════════════════════════

/** Create a new experiment */
export function useCreateExperiment() {
  return useApiMutation({
    mutationFn: (payload: CreateExperimentPayload) => HVTService.createExperiment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hvt"] });
      notify.success("Experiment created");
    },
  });
}

/** Update experiment fields */
export function useUpdateExperiment(id: string) {
  return useApiMutation({
    mutationFn: (payload: UpdateExperimentPayload) => HVTService.updateExperiment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hvt"] });
      notify.success("Experiment updated");
    },
  });
}

/** Start experiment (planned → running) */
export function useStartExperiment() {
  return useApiMutation({
    mutationFn: (id: string) => HVTService.startExperiment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hvt"] });
      notify.success("Experiment started");
    },
  });
}

/** Conclude experiment with results */
export function useConcludeExperiment() {
  return useApiMutation({
    mutationFn: (payload: ConcludeExperimentPayload) => HVTService.concludeExperiment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hvt"] });
      notify.success("Experiment concluded — learning documented!");
    },
  });
}

/** Cancel experiment */
export function useCancelExperiment() {
  return useApiMutation({
    mutationFn: (payload: CancelExperimentPayload) => HVTService.cancelExperiment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hvt"] });
      notify.info("Experiment cancelled");
    },
  });
}

/** Link concluded experiment to IP item */
export function useLinkToIp() {
  return useApiMutation({
    mutationFn: (payload: LinkToIpPayload) => HVTService.linkToIp(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hvt"] });
      notify.success("Experiment linked to IP item");
    },
  });
}

/** Delete experiment (idea/planned only) */
export function useDeleteExperiment() {
  return useApiMutation({
    mutationFn: (id: string) => HVTService.deleteExperiment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hvt"] });
      notify.success("Experiment deleted");
    },
  });
}

/** Review an idea (accept/reject) — L3 */
export function useReviewIdea() {
  return useApiMutation({
    mutationFn: (payload: ReviewIdeaPayload) => HVTService.reviewIdea(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hvt"] });
      notify.success(
        variables.action === "accept"
          ? "Idea accepted — experiment created"
          : "Idea reviewed"
      );
    },
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// L1/L2 — READ HOOKS
// ════════════════════════════════════════════════════════════════════════════════

/** Overview of HVTs in user's programs */
export function useMyProgramsHVT() {
  return useApi({
    queryKey: ["hvt", "my-programs"],
    queryFn: () => HVTService.getMyProgramsOverview(),
  });
}

/** User's submitted ideas */
export function useMyIdeas() {
  return useApi({
    queryKey: ["hvt", "my-ideas"],
    queryFn: () => HVTService.getMyIdeas(),
  });
}

/** Single idea detail */
export function useIdea(ideaId: string) {
  return useApi({
    queryKey: ["hvt", "ideas", ideaId],
    queryFn: () => HVTService.getIdea(ideaId),
    enabled: !!ideaId,
  });
}

/** Submit experiment idea — L1/L2 */
export function useSubmitIdea() {
  return useApiMutation({
    mutationFn: (payload: SubmitIdeaPayload) => HVTService.submitIdea(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hvt", "my-ideas"] });
      notify.success("Idea submitted — your TPM will review it");
    },
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// L2 — TEAM SUMMARY
// ════════════════════════════════════════════════════════════════════════════════

/** Team experiment summary across direct reports */
export function useTeamHVTSummary() {
  return useApi({
    queryKey: ["hvt", "team-summary"],
    queryFn: () => HVTService.getTeamSummary(),
  });
}
