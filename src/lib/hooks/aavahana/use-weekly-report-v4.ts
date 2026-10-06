"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ReportService } from "@/lib/services/aavahana/report.service";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { toast } from "@/utils";
import type { WeeklyReportV4 } from "@/types";

interface UseWeeklyReportV4Return {
  report: WeeklyReportV4 | null;
  happiness: number;
  narrative: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  setHappiness: (value: number) => void;
  submitReport: (additionalNotes?: string) => Promise<void>;
  refresh: () => void;
}

export function useWeeklyReportV4(weekStart: string): UseWeeklyReportV4Return {
  const queryClient = useQueryClient();
  const [happiness, setHappiness] = useState(7);
  const [narrative, setNarrative] = useState<string | null>(null);

  const { data: report = null, isLoading, error, refetch } = useApi({
    queryKey: ["weekly-report-v4", weekStart],
    queryFn: () => ReportService.getWeeklyReportV4(weekStart),
  });

  // Sync local state when report data loads
  useEffect(() => {
    if (report) {
      setNarrative(report.narrative);
      if (report.happiness !== null) setHappiness(report.happiness);
    }
  }, [report]);

  const submitMutation = useApiMutation({
    mutationFn: ({ additionalNotes }: { additionalNotes?: string }) =>
      ReportService.submitWeeklyReportV4({ weekStart, happiness, additionalNotes }),
    onSuccess: (data) => {
      setNarrative(data.narrative);
      queryClient.invalidateQueries({ queryKey: ["weekly-report-v4", weekStart] });
      toast.success("Weekly report submitted!");
    },
    onError: () => toast.error("Failed to submit weekly report."),
  });

  return {
    report,
    happiness,
    narrative,
    isLoading,
    isSubmitting: submitMutation.isPending,
    error: error?.message ?? null,
    setHappiness,
    submitReport: async (additionalNotes) => {
      try { await submitMutation.mutateAsync({ additionalNotes }); } catch { /* onError handles display */ }
    },
    refresh: refetch,
  };
}
