'use client';

import { cn } from '@/utils';
import { PRIORITY_COLORS } from './timetable.constants';
import type { TimetableDeliverable } from '@/types/aavahana/weekly-plan.types';

interface DeliverableGanttProps {
  deliverables: TimetableDeliverable[];
}

const PRIORITY_BAR: Record<TimetableDeliverable['priority'], string> = {
  critical: 'bg-[var(--dt-redDim)]',
  high: 'bg-[var(--dt-amberDim)]',
  medium: 'bg-[var(--dt-tealDim)]',
  low: 'bg-base-300',
};

const PRIORITY_REMAINING: Record<TimetableDeliverable['priority'], string> = {
  critical: 'bg-[var(--dt-redDim)]',
  high: 'bg-[var(--dt-amberDim)]',
  medium: 'bg-[var(--dt-tealDim)]',
  low: 'bg-base-200',
};

export function DeliverableGantt({ deliverables }: DeliverableGanttProps) {
  const visible = deliverables.filter((d) => d.remainingHours > 0);
  if (visible.length === 0) return null;

  const maxHours = Math.max(...visible.map((d) => d.estimatedHours), 1);

  return (
    <div className="mb-5 space-y-2">
      {/* Column headers */}
      <div className="flex items-center gap-2 px-1 mb-3">
        <span className="text-xs font-semibold text-neutral uppercase tracking-wide">
          Deliverable timeline
        </span>
        <div className="flex items-center gap-3 ml-auto text-[10px] text-neutral">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--dt-tealDim)] inline-block" />
            Done
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--dt-tealDim)] border border-[var(--dt-tealBorder)] inline-block" />
            Remaining
          </span>
        </div>
      </div>

      {visible.map((d) => {
        const done = d.estimatedHours - d.remainingHours;
        const donePct = (done / maxHours) * 100;
        const remainPct = (d.remainingHours / maxHours) * 100;

        return (
          <div key={d.id} className="flex items-center gap-3">
            {/* Label */}
            <div className="w-36 flex-shrink-0">
              <p className="text-xs font-medium truncate leading-tight">{d.title}</p>
              <p className="text-[10px] text-neutral">{d.estimatedHours}h total</p>
            </div>

            {/* Bar track */}
            <div
              className={cn('flex-1 h-5 rounded-md overflow-hidden flex', PRIORITY_REMAINING[d.priority])}
            >
              {donePct > 0 && (
                <div
                  className={cn('h-full rounded-l-md transition-all', PRIORITY_BAR[d.priority])}
                  style={{ width: `${donePct}%` }}
                />
              )}
              <div
                className={cn(
                  'h-full border-l border-dashed',
                  PRIORITY_COLORS[d.priority].includes('red')
                    ? 'border-[var(--dt-redBorder)]'
                    : PRIORITY_COLORS[d.priority].includes('orange')
                      ? 'border-[var(--dt-amberBorder)]'
                      : 'border-[var(--dt-tealBorder)]'
                )}
                style={{ width: `${remainPct}%` }}
              />
            </div>

            {/* Hours label */}
            <span className="text-[10px] text-neutral w-10 text-right flex-shrink-0">
              {d.remainingHours}h left
            </span>
          </div>
        );
      })}
    </div>
  );
}
