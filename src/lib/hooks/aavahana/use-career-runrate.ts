"use client";

import { useCallback } from "react";
import { useApi } from "@/lib/hooks/shared/use-api";
import { CareerRunrateService } from "@/lib/services/aavahana/career-runrate.service";
import type { CareerRunrateData, CareerRunrateSnapshot } from "@/types";

interface UseCareerRunrateReturn {
  data: CareerRunrateData | null;
  snapshots: CareerRunrateSnapshot[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCareerRunrate(): UseCareerRunrateReturn {
  const {
    data,
    isLoading: runrateLoading,
    error: runrateError,
    refetch: refetchRunrate,
  } = useApi({
    queryFn: CareerRunrateService.getCareerRunrate,
    queryKey: ["career-runrate"],
  });

  const {
    data: snapshots,
    isLoading: snapshotLoading,
    error: snapshotError,
    refetch: refetchSnapshots,
  } = useApi({
    queryFn: CareerRunrateService.getSnapshotHistory,
    queryKey: ["career-snapshots"],
  });

  const isLoading = runrateLoading || snapshotLoading;

  const refresh = useCallback(() => {
    refetchRunrate();
    refetchSnapshots();
  }, [refetchRunrate, refetchSnapshots]);

  return {
    data: data ?? null,
    snapshots: snapshots ?? [],
    isLoading,
    error: runrateError?.message ?? snapshotError?.message ?? null,
    refresh,
  };
}
