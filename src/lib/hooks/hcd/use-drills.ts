import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HcdDrillService,
  type PrescribedDrill,
  type GapAnalysisResult,
  type PrescriptionResult,
  type AutoDetectResult,
  type DrillCompletion,
  type GenerateDrillsResult,
} from "@/lib/services/hcd/drill.service";
import { isError } from "@/lib/api/client";
import type { HcdByokConfig } from "@/lib/store/hcd/hcd-byok.store";

export function useGapAnalysis(instanceId: number | null) {
  return useQuery<GapAnalysisResult | null>({
    queryKey: ["hcd", "gap-analysis", instanceId],
    queryFn: async () => {
      if (!instanceId) return null;
      const res = await HcdDrillService.getGapAnalysis(instanceId);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    enabled: !!instanceId,
  });
}

export function useMyDrills() {
  return useQuery<PrescribedDrill[]>({
    queryKey: ["hcd", "drills", "mine"],
    queryFn: async () => {
      const res = await HcdDrillService.getMyDrills();
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function usePrescribeDrills() {
  const qc = useQueryClient();
  return useMutation<PrescriptionResult, Error, number>({
    mutationFn: async (instanceId) => {
      const res = await HcdDrillService.prescribe(instanceId);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hcd", "drills"] });
    },
  });
}

export function useGenerateDrills() {
  const qc = useQueryClient();
  return useMutation<GenerateDrillsResult, Error, { instanceId: number; byok: HcdByokConfig }>({
    mutationFn: async ({ instanceId, byok }) => {
      const res = await HcdDrillService.generate(instanceId, byok);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hcd", "drills"] });
    },
  });
}

export function useCompleteDrill() {
  const qc = useQueryClient();
  return useMutation<
    DrillCompletion,
    Error,
    { prescriptionId: number; method: string; voiceNote?: string; voiceTranscript?: string }
  >({
    mutationFn: async ({ prescriptionId, ...data }) => {
      const res = await HcdDrillService.complete(prescriptionId, data);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hcd", "drills"] });
      qc.invalidateQueries({ queryKey: ["hcd", "progress"] });
      qc.invalidateQueries({ queryKey: ["hcd", "recognition", "cohort"] });
    },
  });
}

export function useAutoDetect() {
  const qc = useQueryClient();
  return useMutation<AutoDetectResult, Error, number>({
    mutationFn: async (prescriptionId) => {
      const res = await HcdDrillService.autoDetect(prescriptionId);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hcd", "drills"] });
      qc.invalidateQueries({ queryKey: ["hcd", "progress"] });
      qc.invalidateQueries({ queryKey: ["hcd", "recognition", "cohort"] });
    },
  });
}
