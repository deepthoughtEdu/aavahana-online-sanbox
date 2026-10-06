'use client';

import { Badge } from '@/components/shared/Badge';
import { formatDate } from '@/utils/shared/date.utils';
import type { TrajectoryDelta } from '@/types';

interface TrajectorySignalProps {
  delta: TrajectoryDelta;
}

export function TrajectorySignal({ delta }: TrajectorySignalProps) {
  const { direction, monthsDelta, concreteMilestone } = delta;

  const badgeVariant =
    direction === 'ahead' ? 'success' as const :
    direction === 'behind' ? 'error' as const :
    'info' as const;

  return (
    <div className="flex flex-col gap-1.5">
      {concreteMilestone ? (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={badgeVariant} size="lg" icon={null} label={
              direction === 'ahead' ? `${monthsDelta} months ahead` :
               direction === 'behind' ? `${monthsDelta} months behind` :
               'On track'
            } />
          </div>
          <p className="text-sm opacity-60 leading-snug">
            {concreteMilestone.level} was planned{' '}
            <span className="font-medium text-base-content">
              {formatDate(concreteMilestone.plannedDate, "MMM YYYY")}
            </span>
            {' — '}hit it{' '}
            <span className="font-medium text-base-content">
              {formatDate(concreteMilestone.achievedDate, "MMM YYYY")}
            </span>
            {direction === 'ahead' && `, ${monthsDelta} months early`}
            {direction === 'behind' && `, ${monthsDelta} months late`}
          </p>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Badge variant={badgeVariant} size="lg" icon={null} label={
            direction === 'ahead' ? `${monthsDelta} months ahead` :
             direction === 'behind' ? `${monthsDelta} months behind` :
             'On track'
          } />
          <span className="text-sm opacity-50">of plan</span>
        </div>
      )}
    </div>
  );
}
