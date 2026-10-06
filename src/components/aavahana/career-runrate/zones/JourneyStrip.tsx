'use client';

import { cn } from '@/utils';
import type { CareerLadder, LadderLevel } from '@/types';

interface JourneyStripProps {
  ladder: CareerLadder;
  currentLevel: LadderLevel;
  levelTitles?: Record<string, string>; // level name → title e.g. { L3: "Senior Engineer" }
}

export function JourneyStrip({ ladder, currentLevel, levelTitles = {} }: JourneyStripProps) {
  const levels = [...ladder.levels].sort((a, b) => a.order - b.order);
  const currentIdx = levels.findIndex((l) => l.id === currentLevel.id);
  const fillPct = levels.length > 1 ? (currentIdx / (levels.length - 1)) * 100 : 0;

  return (
    <div className="w-full">
      <div className="relative flex items-start justify-between px-2">
        {/* Track */}
        <div className="absolute top-[10px] left-4 right-4 h-0.5 bg-base-300 z-0" />
        <div
          className="absolute top-[10px] left-4 h-0.5 bg-primary z-0 transition-all duration-700"
          style={{ width: `calc(${fillPct}% - 16px)` }}
        />

        {levels.map((level, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = level.id === currentLevel.id;
          const isFuture = idx > currentIdx;

          return (
            <div
              key={level.id}
              className="relative z-10 flex flex-col items-center gap-1"
            >
              {/* Node */}
              <div className="relative flex items-center justify-center">
                {isCurrent && (
                  <span className="absolute inline-flex rounded-full bg-primary/40 animate-ping"
                    style={{ width: 24, height: 24 }} />
                )}
                <div
                  className={cn(
                    'rounded-full border-2 flex-shrink-0',
                    isPast && 'bg-primary border-primary',
                    isCurrent && 'bg-primary border-primary ring-4 ring-primary/20',
                    isFuture && 'bg-base-100 border-base-300',
                  )}
                  style={{
                    width: isCurrent ? 18 : isPast ? 14 : 11,
                    height: isCurrent ? 18 : isPast ? 14 : 11,
                  }}
                />
              </div>

              {/* Label */}
              <span className={cn(
                'text-xs font-semibold leading-none',
                isCurrent && 'text-primary',
                isFuture && 'opacity-40',
              )}>
                {level.name}
              </span>

              {/* Title */}
              {levelTitles[level.name] && (
                <span className={cn(
                  'text-[10px] leading-none text-center max-w-[56px]',
                  isCurrent ? 'opacity-60' : 'opacity-30',
                )}>
                  {levelTitles[level.name]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
