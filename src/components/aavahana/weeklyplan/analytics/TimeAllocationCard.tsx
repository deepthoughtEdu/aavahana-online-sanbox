import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils';

// DT semantic color maps per activity type
const TYPE_COLOR: Record<string, string> = {
  work: 'bg-info',
  meeting: 'bg-secondary',
  review: 'bg-warning',
  research: 'bg-success',
  learning: 'bg-accent',
  admin: 'bg-base-300',
  planning: 'bg-primary',
  'client-facing': 'bg-error',
};

interface TimeAllocation {
  allocation: Record<string, number>;
  total: number;
}

interface TimeAllocationCardProps {
  totalHours: number;
  targetHours: number;
  progressPercent: number;
  progressStatus: 'success' | 'warning' | 'primary' | 'ghost';
  progressValue: number;
  timeAllocation: TimeAllocation;
}

export function TimeAllocationCard({
  totalHours,
  targetHours,
  progressPercent,
  progressStatus,
  timeAllocation,
}: TimeAllocationCardProps) {
  const entries = Object.entries(timeAllocation.allocation).filter(([, h]) => h > 0);
  const trackedTotal = timeAllocation.total;
  const barBase = Math.max(trackedTotal, targetHours);
  const untrackedHours = Math.max(0, targetHours - trackedTotal);

  return (
    <div className={cn(
      'rounded-lg border',
      progressStatus === 'success' ? 'bg-success/5 border-success/30' :
      progressStatus === 'warning' ? 'bg-warning/5 border-warning/30' :
      progressStatus === 'primary' ? 'bg-primary/5 border-primary/30' :
      'bg-base-200 border-base-300',
      'px-3 py-2'
    )}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-1.5">
          <span className={cn(
            'text-2xl font-bold tabular-nums',
            progressStatus === 'success' ? 'text-success' :
            progressStatus === 'warning' ? 'text-warning' :
            progressStatus === 'primary' ? 'text-primary' :
            'dt-text-dim'
          )}>{totalHours}h</span>
          <span className="text-xs dt-text-dim">/ {targetHours}h target</span>
        </div>
        <Badge
          variant={progressStatus === 'success' ? 'success' : progressStatus === 'warning' ? 'warning' : progressStatus === 'primary' ? 'primary' : 'ghost'}
          size="sm"
          label={
            progressPercent >= 100 ? '✓ Complete' :
            progressPercent >= 75 ? '⚡ Almost There' :
            progressPercent >= 40 ? '↗ In Progress' : '⏰ Get Started'
          }
        />
      </div>

      {/* Stacked bar chart */}
      <div className="w-full h-5 rounded-md overflow-hidden flex mb-2">
        {entries.map(([type, hours]) => (
          <div
            key={type}
            style={{ width: `${(hours / barBase) * 100}%` }}
            className={cn('h-full transition-all', TYPE_COLOR[type] ?? 'bg-base-300')}
            title={`${type}: ${hours}h`}
          />
        ))}
        {untrackedHours > 0 && (
          <div
            style={{ width: `${(untrackedHours / barBase) * 100}%` }}
            className="h-full bg-base-300"
            title={`Untracked: ${untrackedHours}h`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {entries.map(([type, hours]) => {
          const pct = trackedTotal > 0 ? Math.round((hours / trackedTotal) * 100) : 0;
          return (
            <div key={type} className="flex items-center gap-1">
              <span
                className={cn('w-2 h-2 rounded-sm shrink-0', TYPE_COLOR[type] ?? 'bg-base-300')}
              />
              <span className="text-[11px] capitalize text-base-content/65">{type}</span>
              <span className="text-[11px] font-semibold tabular-nums">{hours}h</span>
              <span className="text-[10px] dt-text-dim">({pct}%)</span>
            </div>
          );
        })}
        {untrackedHours > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm shrink-0 bg-base-300" />
            <span className="text-[11px] dt-text-dim">untracked {untrackedHours}h</span>
          </div>
        )}
      </div>
    </div>
  );
}
