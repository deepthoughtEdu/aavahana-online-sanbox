'use client';

import type { WeekInfo } from '@/types/aavahana/weekly-plan.types';
import { formatDate } from '@/utils/shared/date.utils';
import type { TimesheetEntry } from './analytics.utils';

interface TimesheetTableProps {
  entries: TimesheetEntry[];
  currentWeek: WeekInfo | null;
}

const TYPE_BADGE: Record<string, string> = {
  work: 'bg-info/20 text-info',
  meeting: 'bg-secondary/20 text-secondary',
  review: 'bg-warning/20 text-warning',
  learning: 'bg-success/20 text-success',
  admin: 'bg-primary/20 text-primary',
  'client-facing': 'bg-error/20 text-error',
};

function groupByDay(entries: TimesheetEntry[]): Map<string, TimesheetEntry[]> {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const map = new Map<string, TimesheetEntry[]>();
  sorted.forEach((e) => {
    const existing = map.get(e.date) ?? [];
    map.set(e.date, [...existing, e]);
  });
  return map;
}

function formatDayLabel(dateStr: string): string {
  return formatDate(dateStr, "ddd, MMM D");
}

export function TimesheetTable({ entries }: TimesheetTableProps) {
  const grouped = groupByDay(entries);

  if (entries.length === 0) {
    return (
      <div className="bg-base-100 rounded border border-base-300 px-4 py-8 text-center text-sm dt-text-dim">
        No entries for this period.
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded border border-base-300 divide-y divide-base-200">
      {Array.from(grouped.entries()).map(([date, dayEntries]) => {
        const dayTotal = dayEntries.reduce((s, e) => s + e.hours, 0);
        return (
          <div key={date}>
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-base-200/60">
              <span className="text-xs font-semibold dt-text-muted uppercase tracking-wide">
                {formatDayLabel(date)}
              </span>
              <span className="text-xs font-semibold dt-text-dim">{dayTotal}h</span>
            </div>
            {/* Entries */}
            {dayEntries.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-2 hover:bg-base-200/40 transition-colors"
              >
                <span className="text-sm font-medium text-base-content truncate">
                  {entry.deliverableName}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full text-center ${
                    TYPE_BADGE[entry.type] ?? 'bg-base-200 dt-text-muted'
                  }`}
                >
                  {entry.type}
                </span>
                <span className="text-sm font-semibold text-right tabular-nums w-10">{entry.hours}h</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
