"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { ByokRateLimitsService } from "@/lib/services/admin/byok-rate-limits.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { RequestLimitChangePayload, RequestTempBoostPayload } from "@/types/admin";

const STATUS_KEY = ["admin", "byok-rate-limit-status"] as const;
const CONFIG_KEY = ["admin", "byok-rate-limit-config"] as const;

export function useByokRateLimitStatus() {
  return useApi({ queryKey: STATUS_KEY, queryFn: ByokRateLimitsService.getStatus });
}

export function useByokRateLimitConfig() {
  return useApi({ queryKey: CONFIG_KEY, queryFn: ByokRateLimitsService.getConfig });
}

export function useByokRateLimitMutations() {
  const invAll = () => {
    queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    queryClient.invalidateQueries({ queryKey: CONFIG_KEY });
  };

  const requestChange = useApiMutation({
    mutationFn: (p: RequestLimitChangePayload) => ByokRateLimitsService.requestChange(p),
    onSuccess: () => { toast.success("Verification code sent to your email"); },
  });

  const confirmChange = useApiMutation({
    mutationFn: (code: string) => ByokRateLimitsService.confirmChange(code),
    onSuccess: () => { toast.success("Rate limits updated"); invAll(); },
  });

  const requestBoost = useApiMutation({
    mutationFn: (p: RequestTempBoostPayload) => ByokRateLimitsService.requestTempBoost(p),
    onSuccess: () => { toast.success("Verification code sent to your email"); },
  });

  const confirmBoost = useApiMutation({
    mutationFn: (code: string) => ByokRateLimitsService.confirmTempBoost(code),
    onSuccess: () => { toast.success("Temporary boost applied"); invAll(); },
  });

  return {
    requestChange: requestChange.mutateAsync,
    confirmChange: confirmChange.mutateAsync,
    requestBoost: requestBoost.mutateAsync,
    confirmBoost: confirmBoost.mutateAsync,
    isRequesting: requestChange.isPending || requestBoost.isPending,
    isConfirming: confirmChange.isPending || confirmBoost.isPending,
  };
}
