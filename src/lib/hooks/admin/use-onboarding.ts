"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { OnboardingService } from "@/lib/services/admin";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type { OnboardingStatus, OnboardingStepKey, CompleteStepPayload } from "@/types/admin";

const BASE_KEY = ["admin", "onboarding"] as const;

export function useOnboardings(filters?: { status?: OnboardingStatus }) {
  return useApi({
    queryKey: [...BASE_KEY, filters],
    queryFn: () => OnboardingService.list(filters),
  });
}

export function useOnboarding(userId: string) {
  return useApi({
    queryKey: [...BASE_KEY, userId],
    queryFn: () => OnboardingService.get(userId),
    enabled: !!userId,
  });
}

export function useOnboardingMutations() {
  const start = useApiMutation({
    mutationFn: (userId: string) => OnboardingService.start(userId),
    onSuccess: () => { toast.success("Onboarding started"); queryClient.invalidateQueries({ queryKey: BASE_KEY }); },
  });
  const completeStep = useApiMutation({
    mutationFn: ({ userId, stepKey, payload }: { userId: string; stepKey: OnboardingStepKey; payload: CompleteStepPayload }) =>
      OnboardingService.completeStep(userId, stepKey, payload),
    onSuccess: (_, variables) => {
      toast.success("Step completed");
      queryClient.invalidateQueries({ queryKey: [...BASE_KEY, variables.userId] });
    },
  });
  return {
    start: start.mutateAsync,
    completeStep: completeStep.mutateAsync,
    isStarting: start.isPending,
    isCompleting: completeStep.isPending,
  };
}
