'use client';

import { cn } from '@/utils';

interface Stat {
  label: string;
  value: string;
  color: string;
}

interface StatsBarProps {
  focusHours: number;
  highPriorityCount: number;
  eventCount: number;
  deliverablesLeft: number;
}

export function StatsBar({
  focusHours,
  highPriorityCount,
  eventCount,
  deliverablesLeft,
}: StatsBarProps) {
  const stats: Stat[] = [
    { label: 'Focus hours', value: `${focusHours}h`, color: 'text-primary' },
    { label: 'Non-negotiables', value: String(highPriorityCount), color: 'text-warning' },
    { label: 'Events', value: String(eventCount), color: 'text-accent' },
    { label: 'Deliverables left', value: String(deliverablesLeft), color: 'text-success' },
  ];

  return (
    <div className="px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-base-100 rounded-xl p-4 border border-base-300 flex flex-col gap-1"
        >
          <span className={cn('text-2xl font-bold', s.color)}>{s.value}</span>
          <span className="text-xs text-neutral">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
