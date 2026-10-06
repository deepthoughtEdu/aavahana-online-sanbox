"use client";

import { useState, useEffect } from "react";
import { MonthlyReportService } from "@/lib/services/aavahana/monthly-report.service";
import { useApi } from "@/lib/hooks/shared/use-api";
import type {
  MonthlyReport,
  MonthlyKPICommit,
  MonthlyConstraintSummary,
  LeadershipPortfolio,
} from "@/types";
import { isError } from "@/lib/api/client";

interface UseMonthlyReportReturn {
  report: MonthlyReport | null;
  kpiCommits: MonthlyKPICommit[];
  narrative: string | null;
  happiness: number;
  setHappiness: (value: number) => void;
  constraintPatterns: MonthlyConstraintSummary | null;
  portfolio: LeadershipPortfolio | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isGeneratingNarrative: boolean;
  error: string | null;
  updateKPICommit: (kpiId: string, actualValue: string, status: MonthlyKPICommit["status"]) => void;
  submitReport: (additionalNotes?: string) => Promise<void>;
  refresh: () => void;
}

export function useMonthlyReport(month: string): UseMonthlyReportReturn {
  // kpiCommits is user-mutable local state initialized from fetched data
  const [kpiCommits, setKpiCommits] = useState<MonthlyKPICommit[]>([]);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [happiness, setHappiness] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: report = null, isLoading: reportLoading, error: reportError, refetch: refetchReport } = useApi({
    queryKey: ["monthly-report", month],
    queryFn: () => MonthlyReportService.getMonthlyReport(month),
  });

  const { data: fetchedKpiCommits = [], isLoading: kpiLoading, refetch: refetchKpi } = useApi({
    queryKey: ["monthly-kpi-commits", month],
    queryFn: () => MonthlyReportService.getKPICommits(month),
  });

  const { data: constraintPatterns = null } = useApi({
    queryKey: ["monthly-constraint-patterns", month],
    queryFn: () => MonthlyReportService.getConstraintPatterns(month),
    enabled: !!month,
  });

  const { data: portfolio = null, refetch: refetchPortfolio } = useApi({
    queryKey: ["monthly-portfolio", month],
    queryFn: () => MonthlyReportService.getPortfolio(month),
    enabled: !!month,
  });

  // Sync local state from fetched data
  useEffect(() => {
    if (report) {
      setNarrative(report.narrative);
      if (report.happiness != null) setHappiness(report.happiness);
    }
  }, [report]);

  useEffect(() => {
    if (fetchedKpiCommits.length > 0) setKpiCommits(fetchedKpiCommits);
  }, [fetchedKpiCommits]);

  function updateKPICommit(kpiId: string, actualValue: string, status: MonthlyKPICommit["status"]) {
    setKpiCommits((prev) =>
      prev.map((k) => (k.kpiId === kpiId ? { ...k, actualValue, status } : k))
    );
  }

  async function submitReport(additionalNotes?: string) {
    if (!month) return;
    setIsSubmitting(true);
    setIsGeneratingNarrative(true);
    setSubmitError(null);
    try {
      await MonthlyReportService.submitKPICommits({ month, kpiCommits });

      const result = await MonthlyReportService.submitMonthlyReport({
        month,
        kpiCommits,
        additionalNotes,
        happiness,
      });

      if (!isError(result)) {
        setNarrative(result.narrative);
        refetchPortfolio();
      } else {
        setSubmitError("Failed to submit monthly report.");
      }
    } catch {
      setSubmitError("Unexpected error submitting report.");
    } finally {
      setIsSubmitting(false);
      setIsGeneratingNarrative(false);
    }
  }

  return {
    report,
    kpiCommits,
    narrative,
    happiness,
    setHappiness,
    constraintPatterns,
    portfolio,
    isLoading: reportLoading || kpiLoading,
    isSubmitting,
    isGeneratingNarrative,
    error: submitError ?? reportError?.message ?? null,
    updateKPICommit,
    submitReport,
    refresh: () => { refetchReport(); refetchKpi(); },
  };
}
