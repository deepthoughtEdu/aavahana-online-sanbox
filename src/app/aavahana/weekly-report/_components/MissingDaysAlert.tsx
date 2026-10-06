import { WarningIcon } from '@/components/shared/icons';

interface MissingDaysAlertProps {
  days: string[];
}

export function MissingDaysAlert({ days }: MissingDaysAlertProps) {
  if (days.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg bg-warning/10 border border-warning/20 px-4 py-3">
      <WarningIcon size="sm" className="text-warning mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-base-content">Missing daily reports</p>
        <p className="text-xs text-neutral">
          {days.join(', ')} — Consider adding brief reflections for these days.
        </p>
      </div>
    </div>
  );
}
