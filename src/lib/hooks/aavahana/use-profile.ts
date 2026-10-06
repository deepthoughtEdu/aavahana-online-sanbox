"use client";

import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { EmployeeService } from "@/lib/services/shared/employee.service";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import type {
  CompensationField,
  CompensationAccess,
  UpdateProfilePayload,
} from "@/lib/services/shared/employee.service";

const ME_KEY = ["aavahana", "leaves", "me"] as const;

/** Fetch the current user's employment record (includes profile fields). */
export function useEmployeeMe() {
  return useApi({
    queryKey: ME_KEY,
    queryFn: EmployeeService.getMe,
  });
}

/** Mutation for the profile page's Save button. */
export function useProfileMutations() {
  const updateProfile = useApiMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      EmployeeService.updateMyProfile(payload),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ME_KEY });
      queryClient.invalidateQueries({ queryKey: ["payroll", "dashboard"] });
      // The leaves calc depends on workingHours from the profile —
      // invalidate the leaves cache too so previews refresh.
      queryClient.invalidateQueries({ queryKey: ["aavahana", "leaves"] });
    },
  });

  return {
    updateProfile: updateProfile.mutateAsync,
    isSaving: updateProfile.isPending,
  };
}

const COMPENSATION_ACCESS_KEY = ["aavahana", "leaves", "compensation-access"] as const;

/**
 * May the current user edit pay and joining date?
 *
 * Only the `finance` org role and org administrators can. The form reads this
 * to decide whether those two fields render locked. The server enforces it
 * regardless — this is presentation, not security.
 */
export function useCompensationAccess() {
  const { data, isLoading } = useApi({
    queryKey: COMPENSATION_ACCESS_KEY,
    queryFn: EmployeeService.getCompensationAccess,
  });
  return {
    // Default to locked while loading, so the fields never flash editable.
    canEditCompensation: !!(data as CompensationAccess | undefined)?.canEditCompensation,
    isLoading,
  };
}

/** Raise a query with Finance about a field you cannot edit yourself. */
export function useCompensationQuery() {
  const raise = useApiMutation({
    mutationFn: ({ field, message }: { field: CompensationField; message: string }) =>
      EmployeeService.raiseCompensationQuery(field, message),
    onSuccess: () => {
      toast.success("Sent to Finance. They will get back to you on the ticket.");
    },
  });
  return { raiseQuery: raise.mutateAsync, isRaising: raise.isPending };
}
