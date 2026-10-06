import { cn } from '@/utils';

const DOT_COLORS: Record<string, string> = {
  work: 'bg-primary',
  meeting: 'bg-secondary',
  review: 'bg-warning',
  research: 'bg-success',
  learning: 'bg-accent',
  admin: 'bg-base-300',
  planning: 'bg-info',
  'client-facing': 'bg-error',
};

interface TimeAllocation {
  allocation: Record<string, number>;
  total: number;
}

interface TimeBreakdownCardsProps {
  timeAllocation: TimeAllocation;
}

export function TimeBreakdownCards({ timeAllocation }: TimeBreakdownCardsProps) {
  const entries = Object.entries(timeAllocation.allocation).filter(([, h]) => h > 0);
  if (!entries.length) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
      {entries.map(([type, hours]) => {
        const pct = timeAllocation.total > 0
          ? Math.round((hours / timeAllocation.total) * 100)
          : 0;
        return (
          <div key={type} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full shrink-0', DOT_COLORS[type] ?? 'bg-base-400')} />
            <span className="text-xs capitalize dt-text-muted">{type}</span>
            <span className="text-xs font-semibold">{hours}h</span>
            <span className="text-[10px] dt-text-dim">({pct}%)</span>
          </div>
        );
      })}
    </div>
  );
}
