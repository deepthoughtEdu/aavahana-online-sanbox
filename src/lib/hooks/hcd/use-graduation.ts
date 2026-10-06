import { useQuery } from "@tanstack/react-query";
import {
  GraduationService,
  type GraduationFlag,
} from "@/lib/services/hcd/graduation.service";
import { isError } from "@/lib/api/client";

// Coach-facing graduation flags for the caller's org (W3.5). Read-only signal; the
// query mutates nothing and there is no companion mutation hook by design.
export function useGraduationFlags(asOf?: string) {
  return useQuery<GraduationFlag[]>({
    queryKey: ["hcd", "graduation-flags", asOf ?? null],
    queryFn: async () => {
      const res = await GraduationService.getFlags(asOf);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}
