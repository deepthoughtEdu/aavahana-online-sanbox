import { useQuery } from "@tanstack/react-query";
import {
  HcdBlockService,
  type BlockListItem,
} from "@/lib/services/hcd/block.service";
import { isError } from "@/lib/api/client";
import type { McqBlockData } from "@/components/lnd/data/types";

// Assessment block *content* (questions, options) is immutable during a session.
// Cache it hard and don't refetch on window focus — a refetch returns new object
// references mid-assessment, which re-shuffles the MCQ options and re-animates
// the question (the "questions keep refreshing / glitching" report).
// Note: this must NOT be applied to the block list, which carries the mutable
// `completed` field; that field needs to stay fresh after an assessment finishes.
const BLOCK_CONTENT_CACHE = {
  staleTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useBlockList() {
  return useQuery<BlockListItem[]>({
    queryKey: ["hcd", "blocks"],
    queryFn: async () => {
      const res = await HcdBlockService.list();
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function useBlock(blockId: number | null) {
  return useQuery<McqBlockData | null>({
    queryKey: ["hcd", "block", blockId],
    queryFn: async () => {
      if (!blockId) return null;
      const res = await HcdBlockService.get(blockId);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    enabled: !!blockId,
    ...BLOCK_CONTENT_CACHE,
  });
}
