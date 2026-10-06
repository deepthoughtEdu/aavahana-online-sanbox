'use client';

import { cn } from '@/utils';
import { formatDate } from '@/utils/shared/date.utils';
import type { RunwayNode } from '@/types';

interface RunwayTimelineProps {
  nodes: RunwayNode[];
  plannedNextLevelDate?: string;  // for legend
  projectedNextLevelDate?: string | null;
  nextLevelName?: string;
}

export function RunwayTimeline({
  nodes,
  plannedNextLevelDate,
  projectedNextLevelDate,
  nextLevelName,
}: RunwayTimelineProps) {
  const todayNode = nodes.find((n) => n.type === 'current');
  const todayPct = todayNode?.positionPct ?? 30;

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-6">
          Runway
        </p>

        {/* Timeline track container */}
        <div className="relative mx-2" style={{ height: 72 }}>

          {/* Track — full */}
          <div className="absolute top-[10px] left-0 right-0 h-0.5 bg-base-300" />

          {/* Track — filled up to TODAY */}
          <div
            className="absolute top-[10px] left-0 h-0.5 bg-primary"
            style={{ width: `${todayPct}%` }}
          />

          {/* Confidence bands */}
          {nodes.map((node) =>
            node.confidenceBand ? (
              <div
                key={`band-${node.id}`}
                className="absolute top-[7px] h-2 bg-warning/15 rounded-full"
                style={{
                  left: `${node.confidenceBand.leftPct}%`,
                  width: `${node.confidenceBand.widthPct}%`,
                }}
              />
            ) : null
          )}

          {/* Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className="absolute flex flex-col items-center"
              style={{ left: `${node.positionPct}%`, transform: 'translateX(-50%)', top: 0 }}
            >
              {/* Node dot */}
              <div className="relative flex items-center justify-center" style={{ height: 21 }}>
                {node.type === 'current' && (
                  <span
                    className="absolute rounded-full bg-primary/30 animate-ping"
                    style={{ width: 20, height: 20 }}
                  />
                )}
                <div className={cn(
                  'rounded-full flex-shrink-0',
                  node.type === 'achieved' && 'bg-primary border-2 border-primary',
                  node.type === 'current' && 'bg-primary ring-4 ring-primary/20',
                  node.type === 'projected' && 'bg-base-100 border-2 border-warning',
                  node.type === 'future' && 'bg-base-300 border border-base-300 opacity-30',
                )}
                style={{
                  width: node.type === 'current' ? 16 : node.type === 'future' ? 10 : 12,
                  height: node.type === 'current' ? 16 : node.type === 'future' ? 10 : 12,
                  borderStyle: node.type === 'projected' ? 'dashed' : 'solid',
                }}
                />
              </div>

              {/* Labels below node */}
              <div className={cn(
                'flex flex-col items-center mt-1 gap-0',
                node.type === 'future' && 'opacity-30',
              )}>
                <span className={cn(
                  'text-[10px] font-bold leading-none',
                  node.type === 'achieved' && 'text-primary',
                  node.type === 'current' && 'font-bold',
                  node.type === 'projected' && 'text-warning',
                )}>
                  {node.label}
                </span>
                <span className="text-[10px] opacity-50 leading-none mt-0.5">
                  {formatDate(node.date, "MMM YY")}
                </span>
                {node.compositeScore !== undefined && (
                  <span className="text-[10px] font-semibold opacity-70 leading-none mt-0.5">
                    {node.compositeScore}
                  </span>
                )}
                {node.type === 'projected' && node.confidenceBand && (
                  <span className="text-[10px] opacity-40 leading-none mt-0.5">
                    ± {Math.round(
                      Math.abs(
                        (new Date(node.confidenceBand.latest).getTime() -
                          new Date(node.confidenceBand.earliest).getTime()) /
                          (1000 * 60 * 60 * 24 * 30.4)
                      ) / 2
                    )} mo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        {(plannedNextLevelDate || projectedNextLevelDate) && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs opacity-60">
            {plannedNextLevelDate && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-base-300 inline-block rounded" />
                Original plan: {nextLevelName} {formatDate(plannedNextLevelDate, "MMM YY")}
              </span>
            )}
            {projectedNextLevelDate && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-warning inline-block rounded" />
                Projected: {formatDate(projectedNextLevelDate, "MMM YY")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
