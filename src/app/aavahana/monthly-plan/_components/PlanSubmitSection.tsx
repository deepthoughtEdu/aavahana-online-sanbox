'use client';

import { Section } from '@/components/shared/Section';
import { Button } from '@/components/shared/Button';
import { AlertCircleIcon } from '@/components/shared/icons';
import type { ReportStatus } from '@/types';

interface PlanSubmitSectionProps {
  deliverableCount: number;
  plannedHours: number;
  availableHours: number;
  ipGoalCount: number;
  kpiCount: number;
  status: ReportStatus;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export function PlanSubmitSection({
  deliverableCount,
  plannedHours,
  availableHours,
  ipGoalCount,
  kpiCount,
  status,
  onSubmit,
  isSubmitting,
}: PlanSubmitSectionProps) {
  const isSubmitted = status === 'submitted' || status === 'locked';
  const isOvercommitted = plannedHours > availableHours;

  return (
    <Section>
      <Section.Body>
        <div className="text-center space-y-3">
          <p className="text-sm text-base-content/70">
            {deliverableCount} deliverable{deliverableCount !== 1 ? 's' : ''} · {plannedHours}h planned · {ipGoalCount} IP goal{ipGoalCount !== 1 ? 's' : ''} · {kpiCount} KPI{kpiCount !== 1 ? 's' : ''}
          </p>

          {isOvercommitted && !isSubmitted && (
            <div className="flex items-center justify-center gap-2 text-warning text-sm">
              <AlertCircleIcon size="sm" />
              <span>Overcommitted by {plannedHours - availableHours}h</span>
            </div>
          )}

          {isSubmitted ? (
            <p className="text-sm text-success">
              Plan submitted. Weekly plans will pick from your monthly basket.
            </p>
          ) : (
            <>
              <Button
                color="primary"
                modifier="wide"
                onClick={onSubmit}
                loading={isSubmitting}
                disabled={isSubmitting || deliverableCount === 0}
              >
                Submit Monthly Plan
              </Button>
              <p className="text-xs text-base-content/40">
                Submitting locks this plan. Weekly plans will pick from your monthly deliverables basket.
              </p>
            </>
          )}
        </div>
      </Section.Body>
    </Section>
  );
}
