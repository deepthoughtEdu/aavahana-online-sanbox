import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { ConsentService } from "@/lib/services/shared/consent.service";
import type { GiveConsentPayload, WithdrawConsentPayload } from "@/types/shared/consent.types";

export const CONSENT_STATUS_KEY = ["consent", "status"];
export const CONSENT_POLICIES_KEY = ["consent", "policies"];

export function useConsentPolicies(enabled = true) {
  return useApi({
    queryKey: CONSENT_POLICIES_KEY,
    queryFn: () => ConsentService.policies(),
    enabled,
    staleTime: Infinity, // notice text is effectively static within a session
  });
}

export function useConsentStatus(enabled = true) {
  return useApi({
    queryKey: CONSENT_STATUS_KEY,
    queryFn: () => ConsentService.status(),
    enabled,
  });
}

export function useConsentMutations() {
  const give = useApiMutation({
    mutationFn: (payload: GiveConsentPayload) => ConsentService.give(payload),
    invalidateKeys: [CONSENT_STATUS_KEY],
  });
  const withdraw = useApiMutation({
    mutationFn: (payload: WithdrawConsentPayload) => ConsentService.withdraw(payload),
    invalidateKeys: [CONSENT_STATUS_KEY],
  });
  return { give, withdraw };
}
