'use client';

import { Section } from '@/components/shared/Section';
import { ChartLineIcon } from '@/components/shared/icons';
import type { MonthlyFeedbackFlag } from '@/types/aavahana/monthly-plan.types';

interface PlanFeedbackPanelProps {
  flags: MonthlyFeedbackFlag[];
}

const TONE: Record<MonthlyFeedbackFlag['status'], { dot: string; label: string }> = {
  ok: { dot: 'bg-success', label: 'On track' },
  warn: { dot: 'bg-warning', label: 'Worth a look' },
  info: { dot: 'bg-base-content/30', label: 'Note' },
};

/**
 * Spec: "Post-Submit Feedback (Regex / Physics Approach)". Six rule-based flags
 * computed server-side, no LLM. These are awareness signals, never validation:
 * nothing here blocks a submit, and a deliberately thin month is allowed to be
 * thin. The panel says so rather than arguing.
 */
export function PlanFeedbackPanel({ flags }: PlanFeedbackPanelProps) {
  if (flags.length === 0) return null;

  const warnings = flags.filter(f => f.status === 'warn').length;

  return (
    <Section>
      <Section.Header
        icon={<ChartLineIcon size="md" />}
        title="Plan signals"
        subtitle={
          warnings === 0
            ? 'Nothing flagged'
            : `${warnings} thing${warnings === 1 ? '' : 's'} worth a second look`
        }
      />
      <Section.Body>
        <ul className="space-y-2">
          {flags.map((flag) => {
            const tone = TONE[flag.status] ?? TONE.info;
            return (
              <li key={flag.id} className="flex gap-3 bg-base-200 rounded-btn px-3 py-2.5">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${tone.dot}`}
                  aria-label={tone.label}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{flag.title}</p>
                  <p className="text-xs text-base-content/60">{flag.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Section.Body>
    </Section>
  );
}
