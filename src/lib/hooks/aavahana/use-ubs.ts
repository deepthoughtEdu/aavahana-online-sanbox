"use client";

import { useMemo, useCallback } from "react";
import { useApi } from "@/lib/hooks/shared/use-api";
import { UBSService } from "@/lib/services/aavahana/ubs.service";
import {
  STREAK_THRESHOLD,
  LIFECYCLE_PARTICIPATION_KEY,
  LIFECYCLE_PARTICIPATION_LABEL,
} from "@/components/aavahana/ubs/ubs.constants";
import type { UBSScore, UBSTrend, UBSConfigItem } from "@/types";

interface UseUBSReturn {
  currentScore: UBSScore | null;
  trend: UBSTrend | null;
  percentage: number;
  consecutiveWeeks: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useUBS(): UseUBSReturn {
  const {
    data: currentScore,
    isLoading: scoreLoading,
    refetch: refetchScore,
  } = useApi({
    queryFn: UBSService.getCurrentUBS,
    queryKey: ["ubs-current"],
  });

  const {
    data: trend,
    isLoading: trendLoading,
    refetch: refetchTrend,
  } = useApi({
    queryFn: UBSService.getUBSTrend,
    queryKey: ["ubs-trend"],
  });

  const isLoading = scoreLoading || trendLoading;

  const percentage = useMemo(
    () =>
      currentScore && currentScore.maxPossible > 0
        ? Math.round((currentScore.score / currentScore.maxPossible) * 100)
        : 0,
    [currentScore]
  );

  // Count consecutive weeks (most recent first) where score / maxPossible >= STREAK_THRESHOLD
  const consecutiveWeeks = useMemo(() => {
    if (!trend?.weeks || trend.weeks.length === 0) return 0;
    const maxPossible = currentScore?.maxPossible ?? 1;
    const sorted = [...trend.weeks].sort((a, b) =>
      b.weekStart.localeCompare(a.weekStart)
    );
    let streak = 0;
    for (const week of sorted) {
      if (week.score === null) break;
      if (week.score / maxPossible >= STREAK_THRESHOLD) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [trend, currentScore]);

  const refresh = useCallback(() => {
    refetchScore();
    refetchTrend();
  }, [refetchScore, refetchTrend]);

  return {
    currentScore: currentScore ?? null,
    trend: trend ?? null,
    percentage,
    consecutiveWeeks,
    isLoading,
    error: null,
    refresh,
  };
}

interface UseUBSConfigReturn {
  config: UBSConfigItem[];
  isLoading: boolean;
}

/**
 * The logged-in user's effective (resolved) UBS config — the individual tier of
 * the mini-group → org → DT-default resolution. The lifecycle-participation
 * forward key is guaranteed present at weight 0, so it renders even when the
 * resolved org/group config omits it. Weight 0 means it never affects a score.
 */
export function useUBSConfig(): UseUBSConfigReturn {
  const { data, isLoading } = useApi({
    queryFn: UBSService.getUBSConfig,
    queryKey: ["ubs-config"],
  });

  const config = useMemo<UBSConfigItem[]>(() => {
    const items = Array.isArray(data) ? [...data] : [];
    if (!items.some((i) => i.eventType === LIFECYCLE_PARTICIPATION_KEY)) {
      items.push({
        eventType: LIFECYCLE_PARTICIPATION_KEY,
        eventLabel: LIFECYCLE_PARTICIPATION_LABEL,
        weight: 0,
      });
    }
    return items;
  }, [data]);

  return { config, isLoading };
}
