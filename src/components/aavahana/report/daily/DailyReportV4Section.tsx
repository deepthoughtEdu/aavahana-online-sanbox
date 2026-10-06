"use client";

import { AutoDeliverablesSection } from "./AutoDeliverablesSection";
import { VoiceReflectionRecorder } from "./VoiceReflectionRecorder";
import { ExtractedSectionsEditor } from "./ExtractedSectionsEditor";
import { Button } from "@/components/shared/Button";
import { useDailyReportV4 } from "@/lib/hooks/aavahana/use-daily-report-v4";
import { cn } from "@/utils";

interface DailyReportV4SectionProps {
  date: string;
  className?: string;
}

/**
 * PDGMS v4.0 daily report section — embeds alongside existing PreSubmissionView.
 * Adds: auto-deliverables, voice → LLM extraction, constraint picker, timesheet, claims.
 * Can be shown as an expandable section or tab in the existing daily report container.
 */
export function DailyReportV4Section({ date, className }: DailyReportV4SectionProps) {
  const {
    autoDeliverables,
    programLabels,
    sections,
    isLoading,
    isExtracting,
    isSubmitting,
    isSubmitted,
    extractSections,
    editSection,
    submitReport,
  } = useDailyReportV4(date);

  if (isLoading) {
    return (
      <div className={cn("space-y-4 animate-pulse", className)}>
        <div className="h-6 bg-base-300 rounded w-40" />
        <div className="h-24 bg-base-300 rounded-xl" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="divider">
        <span className="text-xs opacity-40 uppercase tracking-wide">v4.0 Structured Report</span>
      </div>

      {/* Auto-populated deliverables */}
      <div className="bg-base-100 rounded-2xl border border-base-300 p-4">
        <AutoDeliverablesSection deliverables={autoDeliverables} />
      </div>

      {/* Voice → LLM extraction */}
      {!isSubmitted && (
        <div className="bg-base-100 rounded-2xl border border-base-300 p-4">
          <VoiceReflectionRecorder
            onExtract={extractSections}
            isExtracting={isExtracting}
          />
        </div>
      )}

      {/* Extracted + editable sections */}
      {Object.keys(sections).length > 1 && (
        <ExtractedSectionsEditor
          sections={sections}
          availableLabels={programLabels}
          onEdit={editSection}
          disabled={isSubmitted}
        />
      )}

      {/* Submit */}
      {!isSubmitted && Object.keys(sections).length > 1 && (
        <Button
          color="primary"
          modifier="block"
          onClick={submitReport}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-xs" />
              Submitting…
            </>
          ) : (
            "Submit Daily Report (v4)"
          )}
        </Button>
      )}

      {isSubmitted && (
        <div className="alert alert-success">
          <span className="text-sm">Daily report submitted ✓</span>
        </div>
      )}
    </div>
  );
}
