import { useQuery } from "@tanstack/react-query";
import {
  DependencyCurveService,
  type DependencyCurve,
} from "@/lib/services/hcd/dependency-curve.service";
import { isError } from "@/lib/api/client";

export function useDependencyCurve(months?: number) {
  return useQuery<DependencyCurve>({
    queryKey: ["hcd", "dependency-curve", months ?? null],
    queryFn: async () => {
      const res = await DependencyCurveService.getCurve(months);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}
