import { useQuery } from "@tanstack/react-query";
import { HcdProgressService, type MyProgress } from "@/lib/services/hcd/progress.service";
import { isError } from "@/lib/api/client";

export const HCD_PROGRESS_KEY = ["hcd", "progress", "mine"] as const;

export function useMyProgress() {
  return useQuery<MyProgress>({
    queryKey: HCD_PROGRESS_KEY,
    queryFn: async () => {
      const res = await HcdProgressService.getMine();
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}
