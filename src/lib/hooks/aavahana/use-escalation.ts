import { useQuery } from "@tanstack/react-query";
import {
  EscalationService,
  type EscalationMatrixEntry,
} from "@/lib/services/aavahana/escalation.service";
import { isError } from "@/lib/api/client";
import { useAuth } from "@/lib/hooks/shared/use-auth";

// Escalation matrix (W4.1). Read-only, supervisor/admin only at the API.
//
// Gated on org context. The api client attaches X-Organization-Id from apiContext,
// which is not populated on the first render — firing before it lands sent a headerless
// request and the backend answered 400 [[error:organization-context-required]], which
// surfaced as an error toast on every trinethra page load.
export function useEscalationMatrix(source?: string) {
  const { selectedOrg } = useAuth();
  const orgId = selectedOrg?.orgId ?? null;

  return useQuery<EscalationMatrixEntry[]>({
    queryKey: ["escalation", "matrix", orgId, source ?? null],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const res = await EscalationService.getMatrix(source);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}
