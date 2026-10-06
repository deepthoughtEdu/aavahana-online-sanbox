import { useQuery } from "@tanstack/react-query";
import {
  SupervisorUsageService,
  type UsageGrid,
} from "@/lib/services/aavahana/supervisor-usage.service";
import { isError } from "@/lib/api/client";

export function useSupervisorUsage(weekStart?: string) {
  return useQuery<UsageGrid>({
    queryKey: ["supervisor", "usage", weekStart ?? null],
    queryFn: async () => {
      const res = await SupervisorUsageService.getUsageGrid(weekStart);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}
