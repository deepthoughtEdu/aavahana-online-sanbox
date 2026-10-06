"use client";

import { cn } from "@/utils";
import { ConstraintPicker } from "@/components/shared/ConstraintPicker";
import { TimesheetCategoryBreakdown } from "@/components/shared/TimesheetCategoryBreakdown";
import { LabelClaimInput } from "@/components/shared/LabelClaimInput";
import type {
  DailyReportV4Sections,
  ProgramLabel,
} from "@/types";

interface ExtractedSectionsEditorProps {
  sections: Partial<DailyReportV4Sections>;
  availableLabels: ProgramLabel[];
  onEdit: <K extends keyof DailyReportV4Sections>(
    key: K,
    value: DailyReportV4Sections[K]
  ) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Renders LLM-extracted daily report sections as editable cards.
 * Each section can be overridden by the employee.
 * Module 2 (Daily Report) — REBUILD per PDGMS v4.0 A74-A75.
 */
export function ExtractedSectionsEditor({
  sections,
  availableLabels,
  onEdit,
  disabled = false,
  className,
}: ExtractedSectionsEditorProps) {
  const frameworkLabels = availableLabels.filter((l) => l.type === "framework");
  const processLabels = availableLabels.filter((l) => l.type === "process");

  return (
    <div className={cn("space-y-4", className)}>
      <TextSection
        label="What I Planned"
        value={sections.plan ?? ""}
        onChange={(v) => onEdit("plan", v)}
        disabled={disabled}
      />
      <TextSection
        label="What I Actually Did"
        value={sections.actuals ?? ""}
        onChange={(v) => onEdit("actuals", v)}
        disabled={disabled}
      />

      <div className="bg-base-200 rounded-xl p-4">
        <ConstraintPicker
          constraints={sections.bottleneck ?? []}
          onChange={(v) => onEdit("bottleneck", v)}
          disabled={disabled}
        />
      </div>

      <TextSection
        label="Course Correction"
        value={sections.courseCorrection ?? ""}
        onChange={(v) => onEdit("courseCorrection", v)}
        disabled={disabled}
        placeholder="What are you doing differently?"
      />

      {/* Org-configurable rituals */}
      {(sections.rituals ?? []).map((ritual, i) => (
        <div key={ritual.ritualId} className="bg-base-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium">{ritual.ritualName}</p>
          <textarea
            value={ritual.content}
            onChange={(e) => {
              const updated = [...(sections.rituals ?? [])];
              updated[i] = { ...ritual, content: e.target.value };
              onEdit("rituals", updated);
            }}
            disabled={disabled}
            rows={2}
            className="textarea textarea-bordered textarea-sm w-full resize-none"
          />
        </div>
      ))}

      <TextSection
        label="Vision for Tomorrow"
        value={sections.visionForTomorrow ?? ""}
        onChange={(v) => onEdit("visionForTomorrow", v)}
        disabled={disabled}
        placeholder="What will you focus on tomorrow?"
      />

      <div className="bg-base-200 rounded-xl p-4">
        <LabelClaimInput
          claims={sections.frameworkClaims ?? []}
          availableLabels={frameworkLabels}
          onChange={(v) => onEdit("frameworkClaims", v)}
          label="Framework Claims"
          disabled={disabled}
        />
      </div>

      <div className="bg-base-200 rounded-xl p-4">
        <LabelClaimInput
          claims={sections.processClaims ?? []}
          availableLabels={processLabels}
          onChange={(v) => onEdit("processClaims", v)}
          label="Process Claims"
          disabled={disabled}
        />
      </div>

      <div className="bg-base-200 rounded-xl p-4">
        <TimesheetCategoryBreakdown
          categories={sections.timesheetEstimates ?? []}
          onChange={(v) => onEdit("timesheetEstimates", v)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function TextSection({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="bg-base-200 rounded-xl p-4 space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={3}
        placeholder={placeholder}
        className="textarea textarea-bordered textarea-sm w-full resize-none"
      />
    </div>
  );
}
