"use client";

import { useRouter } from "next/navigation";
import { Section } from "@/components/shared/Section";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { CheckIcon, ChartLineIcon } from "@/components/shared/icons";
import { ROUTES } from "@/config/routes";

interface PlanSubmitSectionProps {
  taskCount: number;
  totalMins: number;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  disabled: boolean;
  submitLabel?: string;
}

export function PlanSubmitSection({
  taskCount,
  totalMins,
  onSubmit,
  isSubmitting,
  disabled,
  submitLabel,
}: PlanSubmitSectionProps) {
  const router = useRouter();
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  const overThreshold = totalMins > 480;

  return (
    <Section>
      <Section.Body>
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm font-medium">
            {taskCount} {taskCount === 1 ? "task" : "tasks"} · {timeLabel} planned
          </p>

          {overThreshold && (
            <Badge variant="warning" size="sm" label="Over 8h threshold — consider deferring" />
          )}

          <Button
            id="tour-plan-submit-btn"
            size="md"
            color="primary"
            modifier="wide"
            disabled={disabled || isSubmitting}
            loading={isSubmitting}
            onClick={onSubmit}
            iconBefore={<CheckIcon size="sm" />}
          >
            {submitLabel ?? "Submit Daily Plan"}
          </Button>

          <p className="text-xs dt-text-muted text-center">
            After submitting, go to Daily Report to log your day.
          </p>

          <Button
            id="tour-plan-open-report-btn"
            size="sm"
            variant="soft"
            color="secondary"
            onClick={() => router.push(ROUTES.aavahana.dailyReport._)}
            iconBefore={<ChartLineIcon size="sm" />}
          >
            Open Daily Report
          </Button>
        </div>
      </Section.Body>
    </Section>
  );
}
