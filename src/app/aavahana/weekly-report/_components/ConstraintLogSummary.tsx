import { FileAsImprovementObject } from '@/components/hcd/FileAsImprovementObject';
import type {
  IncomingTicket,
  PendingTicket,
  ActionedTicket,
} from '@/types/shared/event-loop.types';

interface ConstraintLogSummaryProps {
  tickets: {
    incoming: IncomingTicket[];
    pending: PendingTicket[];
    actioned: ActionedTicket[];
  };
}

export function ConstraintLogSummary({ tickets }: ConstraintLogSummaryProps) {
  const openCount = tickets.incoming.length;
  const pendingCount = tickets.pending.length;
  const actionedCount = tickets.actioned.length;
  const total = openCount + pendingCount + actionedCount;

  if (total === 0) {
    return <p className="text-sm text-neutral py-2">No constraints this week.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Summary counts */}
      <div className="flex gap-4 text-xs">
        {openCount > 0 && (
          <span className="text-error font-medium">{openCount} open</span>
        )}
        {pendingCount > 0 && (
          <span className="text-warning font-medium">{pendingCount} pending V4</span>
        )}
        {actionedCount > 0 && (
          <span className="text-success font-medium">{actionedCount} resolved/actioned</span>
        )}
      </div>

      {/* Ticket list */}
      <ul className="divide-y divide-base-300">
        {tickets.incoming.map((t) => (
          <li key={t.ticketId} className="flex items-start gap-2 py-2">
            <span className="text-xs mt-0.5">🔴</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-base-content truncate">{t.context}</p>
              <p className="text-xs text-neutral">{t.type} · open</p>
              {/* An open constraint can be filed as a Spotted Improvement Object. */}
              <div className="mt-1">
                <FileAsImprovementObject
                  sourceType="weekly_report"
                  sourceId={String(t.ticketId)}
                  defaultTitle={t.context}
                  cta="File as improvement"
                />
              </div>
            </div>
          </li>
        ))}
        {tickets.pending.map((t) => (
          <li key={t.ticketId} className="flex items-start gap-2 py-2">
            <span className="text-xs mt-0.5">🟡</span>
            <div className="min-w-0">
              <p className="text-sm text-base-content truncate">{t.escalateRequest}</p>
              <p className="text-xs text-neutral">
                routed → {t.sentTo}
                {t.nudgeCount > 0 && ` (nudged ${t.nudgeCount}x)`}
              </p>
            </div>
          </li>
        ))}
        {tickets.actioned.map((t) => (
          <li key={t.ticketId} className="flex items-start gap-2 py-2">
            <span className="text-xs mt-0.5">🟢</span>
            <div className="min-w-0">
              <p className="text-sm text-base-content truncate">{t.layer4Note}</p>
              <p className="text-xs text-neutral">
                {t.layer4Decision} · {t.status}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
