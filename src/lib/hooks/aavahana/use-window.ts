import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  WindowService,
  type WindowDecision,
} from "@/lib/services/aavahana/window.service";
import { isError } from "@/lib/api/client";

export function useWindowDecisions(status?: string) {
  return useQuery<WindowDecision[]>({
    queryKey: ["window", "decisions", status ?? null],
    queryFn: async () => {
      const res = await WindowService.listDecisions(status);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function useDecideDecision() {
  const qc = useQueryClient();
  return useMutation<WindowDecision, Error, { id: number; decision: string }>({
    mutationFn: async ({ id, decision }) => {
      const res = await WindowService.decide(id, decision);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["window", "decisions"] }),
  });
}

export function useCommunicateDecision() {
  const qc = useQueryClient();
  return useMutation<WindowDecision, Error, number>({
    mutationFn: async (id) => {
      const res = await WindowService.communicate(id);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["window", "decisions"] }),
  });
}
