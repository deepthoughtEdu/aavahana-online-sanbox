import { useQuery } from "@tanstack/react-query";
import {
  FellowQuotaService,
  type FellowQuota,
  type FellowQuotaRollup,
} from "@/lib/services/hcd/fellow-quota.service";
import { isError } from "@/lib/api/client";

// The caller's own weekly quota state — visible any time mid-week (W3.4).
export function useFellowQuota(weekStart?: string) {
  return useQuery<FellowQuota>({
    queryKey: ["hcd", "fellow-quota", weekStart ?? null],
    queryFn: async () => {
      const res = await FellowQuotaService.getSelf(weekStart);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

// DT-management rollup — per-Fellow adherence this week, unmet first (W3.4).
export function useFellowQuotaRollup(weekStart?: string) {
  return useQuery<FellowQuotaRollup>({
    queryKey: ["hcd", "fellow-quota", "rollup", weekStart ?? null],
    queryFn: async () => {
      const res = await FellowQuotaService.getRollup(weekStart);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}
