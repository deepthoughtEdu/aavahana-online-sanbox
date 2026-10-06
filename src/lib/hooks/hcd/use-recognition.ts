import { useQuery } from "@tanstack/react-query";
import {
  HcdRecognitionService,
  type VerifiedInitiative,
  type PendingVerification,
  type ImpactSummary,
  type CohortRow,
} from "@/lib/services/hcd/recognition.service";
import { isError } from "@/lib/api/client";
import type { TacitDataset } from "@/lib/services/hcd/tacit-clean";

export function useMyRecognition() {
  return useQuery<VerifiedInitiative[]>({
    queryKey: ["hcd", "recognition", "mine"],
    queryFn: async () => {
      const res = await HcdRecognitionService.getMyRecognition();
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function usePendingVerifications() {
  return useQuery<PendingVerification[]>({
    queryKey: ["hcd", "recognition", "pending"],
    queryFn: async () => {
      const res = await HcdRecognitionService.getPendingVerifications();
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function useImpactSummary() {
  return useQuery<ImpactSummary>({
    queryKey: ["hcd", "recognition", "summary"],
    queryFn: async () => {
      const res = await HcdRecognitionService.getImpactSummary();
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function useCohort(enabled: boolean) {
  return useQuery<CohortRow[]>({
    queryKey: ["hcd", "recognition", "cohort"],
    queryFn: async () => {
      const res = await HcdRecognitionService.getCohort();
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    enabled,
  });
}

export function useReflectionDataset() {
  return useQuery<TacitDataset>({
    queryKey: ["hcd", "recognition", "reflections"],
    queryFn: async () => {
      const res = await HcdRecognitionService.getReflectionDataset();
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}
