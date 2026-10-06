'use client';

import { cn } from '@/utils';

const ZONES = [
  { label: 'Peak focus', color: 'bg-[var(--dt-greenDim)] border-[var(--dt-greenBorder)]' },
  { label: 'Mid energy', color: 'bg-[var(--dt-amberDim)] border-[var(--dt-amberBorder)]' },
  { label: 'Low energy', color: 'bg-[var(--dt-redDim)] border-[var(--dt-redBorder)]' },
];

export function EnergyLegend() {
  return (
    <div className="px-4 sm:px-6 flex flex-wrap items-center gap-4 text-xs text-neutral">
      <span className="font-medium">Energy zones:</span>
      {ZONES.map((e) => (
        <span
          key={e.label}
          className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full border', e.color)}
        >
          <span className="w-2 h-2 rounded-full inline-block bg-current opacity-60" />
          {e.label}
        </span>
      ))}
      <span className="ml-2">· Slot colour reflects your energy from your weekly plan.</span>
    </div>
  );
}
