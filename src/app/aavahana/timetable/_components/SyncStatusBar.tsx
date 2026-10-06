'use client';

import { cn } from '@/utils';

interface SyncStatusBarProps {
  pendingCount: number;
  failedCount: number;
}

export function SyncStatusBar({ pendingCount, failedCount }: SyncStatusBarProps) {
  if (pendingCount === 0 && failedCount === 0) return null;

  return (
    <div className="px-4 sm:px-6">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium border',
          failedCount > 0
            ? 'bg-[var(--dt-redDim)] border-[var(--dt-redBorder)] text-error'
            : 'bg-[var(--dt-amberDim)] border-[var(--dt-amberBorder)] text-warning'
        )}
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            failedCount > 0 ? 'bg-error' : 'bg-warning animate-pulse'
          )}
        />
        {failedCount > 0
          ? `${failedCount} event${failedCount !== 1 ? 's' : ''} failed to sync — will retry when connection is restored`
          : `${pendingCount} event${pendingCount !== 1 ? 's' : ''} saved locally, syncing to server…`}
      </div>
    </div>
  );
}
