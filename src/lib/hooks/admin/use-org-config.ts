"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { OrgConfigService } from "@/lib/services/admin";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type {
  UpdateIdentityPayload, UpdateLaddersPayload, UpdateWorkingDaysPayload,
  UpdateHealthWeightsPayload, UpdateNotificationsPayload,
  UpdateGoverningQuestionsPayload, UpdateScoringPayload, UpdateEnablersPayload,
} from "@/types/admin";

const KEY = ["admin", "org-config"] as const;

export function useOrgConfig() {
  return useApi({
    queryKey: KEY,
    queryFn: OrgConfigService.get,
    staleTime: 1000 * 60 * 5,
  });
}

export function useOrgConfigMutations() {
  const inv = () => queryClient.invalidateQueries({ queryKey: KEY });

  const updateIdentity = useApiMutation({
    mutationFn: (p: UpdateIdentityPayload) => OrgConfigService.updateIdentity(p),
    onSuccess: () => { toast.success("Identity saved"); inv(); },
  });
  const updateLadders = useApiMutation({
    mutationFn: (p: UpdateLaddersPayload) => OrgConfigService.updateLadders(p),
    onSuccess: () => { toast.success("Ladders saved"); inv(); },
  });
  const updateWorkingDays = useApiMutation({
    mutationFn: (p: UpdateWorkingDaysPayload) => OrgConfigService.updateWorkingDays(p),
    onSuccess: () => { toast.success("Working days saved"); inv(); },
  });
  const updateHealthWeights = useApiMutation({
    mutationFn: (p: UpdateHealthWeightsPayload) => OrgConfigService.updateHealthWeights(p),
    onSuccess: () => { toast.success("Health weights saved"); inv(); },
  });
  const updateNotifications = useApiMutation({
    mutationFn: (p: UpdateNotificationsPayload) => OrgConfigService.updateNotifications(p),
    onSuccess: () => { toast.success("Notifications saved"); inv(); },
  });
  const updateGoverningQuestions = useApiMutation({
    mutationFn: (p: UpdateGoverningQuestionsPayload) => OrgConfigService.updateGoverningQuestions(p),
    onSuccess: () => { toast.success("Questions saved"); inv(); },
  });
  const updateScoring = useApiMutation({
    mutationFn: (p: UpdateScoringPayload) => OrgConfigService.updateScoring(p),
    onSuccess: () => { toast.success("Scoring saved"); inv(); },
  });
  const updateEnablers = useApiMutation({
    mutationFn: (p: UpdateEnablersPayload) => OrgConfigService.updateEnablers(p),
    onSuccess: () => { toast.success("Enablers saved"); inv(); },
  });

  return {
    updateIdentity: updateIdentity.mutateAsync,
    updateLadders: updateLadders.mutateAsync,
    updateWorkingDays: updateWorkingDays.mutateAsync,
    updateHealthWeights: updateHealthWeights.mutateAsync,
    updateNotifications: updateNotifications.mutateAsync,
    updateGoverningQuestions: updateGoverningQuestions.mutateAsync,
    updateScoring: updateScoring.mutateAsync,
    updateEnablers: updateEnablers.mutateAsync,
    isUpdating: updateIdentity.isPending || updateLadders.isPending || updateWorkingDays.isPending ||
      updateHealthWeights.isPending || updateNotifications.isPending ||
      updateGoverningQuestions.isPending || updateScoring.isPending || updateEnablers.isPending,
  };
}
