'use client';

import { useEffect, useRef } from 'react';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils';
import type { CareerRunrateSnapshotEnriched } from '@/types';

interface MomentumStripProps {
  snapshots: CareerRunrateSnapshotEnriched[];
}

function chipClasses(dir: CareerRunrateSnapshotEnriched['deltaDirection']): string {
  switch (dir) {
    case 'up':   return 'bg-success/10 border-success/30';
    case 'down': return 'bg-error/10 border-error/30';
    case 'flat': return 'bg-base-200 border-base-300';
    default:     return 'bg-base-200 border-base-300';
  }
}

function arrowColor(dir: CareerRunrateSnapshotEnriched['deltaDirection']): string {
  switch (dir) {
    case 'up':   return 'text-success';
    case 'down': return 'text-error';
    default:     return 'opacity-0';
  }
}

export function MomentumStrip({ snapshots }: MomentumStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [snapshots]);

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-4">
          Month-over-Month
        </p>
        <div
          ref={containerRef}
          className="flex gap-2 overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {snapshots.map((snap) => (
            <div
              key={snap.date}
              className="relative flex-shrink-0 flex flex-col items-center w-[60px]"
            >
              {/* Level change badge */}
              {snap.isLevelChange && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="primary" size="sm" icon={null} className="whitespace-nowrap" label={snap.level} />
                </div>
              )}

              {/* Month chip */}
              <div className={cn(
                'rounded-xl p-2 text-center w-full border',
                chipClasses(snap.deltaDirection),
              )}>
                <p className="text-[10px] font-medium opacity-60 leading-none mb-1">
                  {snap.monthLabel}
                </p>
                <p className="text-base font-bold leading-none">
                  {snap.compositeScore}
                </p>
                <div className={cn(
                  'flex items-center justify-center gap-0.5 text-[10px] mt-1 h-3',
                  arrowColor(snap.deltaDirection),
                )}>
                  {snap.delta !== null && snap.delta !== 0 && (
                    <>
                      {snap.deltaDirection === 'up' ? '↑' : '↓'}
                      {' '}{Math.abs(snap.delta)}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
