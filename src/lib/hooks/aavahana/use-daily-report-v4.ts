"use client";

import { useState, useEffect } from "react";
import { ReportService } from "@/lib/services/aavahana/report.service";
import { PlanService } from "@/lib/services/aavahana/plan.service";
import { useApi } from "@/lib/hooks/shared/use-api";
import { isError } from "@/lib/api/client";
import { toast } from "@/utils";
import type {
  DailyReportV4,
  DailyReportV4Sections,
  AutoDeliverable,
  OrgRitual,
  ProgramLabel,
} from "@/types";

interface UseDailyReportV4Return {
  autoDeliverables: AutoDeliverable[];
  orgRituals: OrgRitual[];
  programLabels: ProgramLabel[];
  sections: Partial<DailyReportV4Sections>;
  isLoading: boolean;
  isExtracting: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  error: string | null;
  extractSections: (transcript: string) => Promise<void>;
  editSection: <K extends keyof DailyReportV4Sections>(
    key: K,
    value: DailyReportV4Sections[K]
  ) => void;
  submitReport: () => Promise<void>;
}

/**
 * Hook for PDGMS v4.0 Daily Report flow:
 * 1. Auto-populate deliverables from ticket state changes
 * 2. Voice → generate_daily_report LLM → extract sections
 * 3. Employee edits any section
 * 4. Submit → locked
 */
export function useDailyReportV4(date: string): UseDailyReportV4Return {
  const [sections, setSections] = useState<Partial<DailyReportV4Sections>>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: autoDeliverables = [], isLoading: delLoading } = useApi({
    queryKey: ["daily-report-v4-deliverables", date],
    queryFn: () => ReportService.getAutoDeliverables(date),
  });

  const { data: orgRituals = [], isLoading: ritualsLoading } = useApi({
    queryKey: ["daily-report-v4-rituals"],
    queryFn: () => ReportService.getOrgRituals(),
  });

  const { data: programLabels = [], isLoading: labelsLoading } = useApi({
    queryKey: ["daily-report-v4-labels"],
    queryFn: () => PlanService.getProgramLabels(),
  });

  // Pre-populate sections when data loads
  useEffect(() => {
    if (autoDeliverables.length > 0) {
      setSections((prev) => ({ ...prev, deliverables: autoDeliverables }));
    }
  }, [autoDeliverables]);

  useEffect(() => {
    if (orgRituals.length > 0) {
      setSections((prev) => ({
        ...prev,
        rituals: orgRituals
          .filter((r) => r.enabled)
          .map((r) => ({ ritualId: r.ritualId, ritualName: r.ritualName, content: "" })),
      }));
    }
  }, [orgRituals]);

  async function extractSections(transcript: string) {
    if (!transcript.trim()) {
      toast.error("Please record a voice message first.");
      return;
    }
    setIsExtracting(true);
    try {
      const result = await ReportService.extractFromVoice({
        transcript,
        dailyPlanItems: [],
        programLabels,
      });

      if (isError(result)) {
        toast.error("Failed to extract sections from voice.");
      } else if (result.llmUnavailable) {
        toast.error("Voice processing unavailable — LLM service not connected.");
      } else {
        setSections((prev) => ({
          ...prev,
          frameworkClaims: result.frameworkClaims ?? prev.frameworkClaims,
          processClaims: result.processClaims ?? prev.processClaims,
          visionForTomorrow: result.visionForTomorrow ?? prev.visionForTomorrow,
          bottleneck: result.constraintsIdentified ?? prev.bottleneck,
          timesheetEstimates: result.timesheetEntries ?? prev.timesheetEstimates,
          deliverables: prev.deliverables ?? [],
          rituals: prev.rituals ?? [],
        }));
        toast.success("Sections extracted! Review and edit below.");
      }
    } catch {
      toast.error("Unexpected error during voice extraction.");
    } finally {
      setIsExtracting(false);
    }
  }

  function editSection<K extends keyof DailyReportV4Sections>(
    key: K,
    value: DailyReportV4Sections[K]
  ) {
    setSections((prev) => ({ ...prev, [key]: value }));
  }

  async function submitReport() {
    setIsSubmitting(true);
    try {
      const report: DailyReportV4 = {
        date,
        status: "submitted",
        sections: sections as DailyReportV4Sections,
        submittedAt: new Date().toISOString(),
      };

      const result = await ReportService.submitDailyReportV4(report);

      if (isError(result)) {
        toast.error("Failed to submit report.");
      } else {
        setIsSubmitted(true);
        toast.success("Daily report submitted!");
      }
    } catch {
      toast.error("Unexpected error submitting report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    autoDeliverables,
    orgRituals,
    programLabels,
    sections,
    isLoading: delLoading || ritualsLoading || labelsLoading,
    isExtracting,
    isSubmitting,
    isSubmitted,
    error: null,
    extractSections,
    editSection,
    submitReport,
  };
}
