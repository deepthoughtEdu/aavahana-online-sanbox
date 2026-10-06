import { useState } from "react";
import { cn } from "@/utils";
import { slaRemainingHours, slaUrgencyColor } from "@/config/mimamsaka/escalation";
import type { PendingTicket } from "@/types/shared/event-loop.types";

const NUDGE_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

export function PendingCard({ ticket }: { ticket: PendingTicket }) {
  const [lastNudge, setLastNudge]   = useState<number | null>(
    ticket.lastNudge ? new Date(ticket.lastNudge).getTime() : null
  );
  const [_nudgeCount, setNudgeCount] = useState(ticket.nudgeCount);

  const now             = Date.now();
  const cooldownRemain  = lastNudge ? NUDGE_COOLDOWN_MS - (now - lastNudge) : 0;
  const nudgeCoolingDown = cooldownRemain > 0;
  const minutesLeft     = Math.ceil(cooldownRemain / 60000);

  const sentAgo = ticket.sentAt
    ? Math.round((now - new Date(ticket.sentAt).getTime()) / 3600000)
    : 0;

  const slaRemaining = ticket.slaHours && ticket.createdAt
    ? slaRemainingHours(ticket.createdAt, ticket.slaHours)
    : null;
  // slaUrgencyColor returns a CSS hex/var string — use inline style only for this dynamic value
  const slaColor = slaRemaining !== null ? slaUrgencyColor(slaRemaining) : undefined;

  function handleNudge() {
    if (nudgeCoolingDown) return;
    setLastNudge(Date.now());
    setNudgeCount((c) => c + 1);
  }

  return (
    <div className="mx-2.5 my-2.5 px-3.5 py-3 bg-base-100 border border-base-300 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-[10px] font-bold text-base-content/70">
            {ticket.ticketId}
          </span>
          <span className="text-[10px] text-neutral ml-1.5">
            {ticket.taskId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral">Sent {sentAgo}h ago</span>
          {slaRemaining !== null && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded border"
              style={slaColor ? { color: slaColor, background: `${slaColor}18`, borderColor: `${slaColor}40` } : undefined}
            >
              {slaRemaining <= 0 ? "SLA OVERDUE" : `${Math.round(slaRemaining)}h left`}
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-base-content leading-[1.45] mb-1.5">
        {ticket.escalateRequest}
      </div>

      <div className="text-xs text-neutral mb-3">
        Escalated to {ticket.sentTo}{ticket.slaHours != null ? ` · ${ticket.slaHours}h response window` : ""} · Your time on this is being tracked
      </div>

      <div className="text-right">
        <button
          onClick={handleNudge}
          disabled={nudgeCoolingDown}
          className={cn(
            "px-3.5 py-1 border rounded text-xs",
            nudgeCoolingDown
              ? "bg-base-200 text-base-content/40 border-base-300 cursor-default"
              : "bg-transparent text-base-content/70 border-base-content/20 cursor-pointer",
          )}
        >
          {nudgeCoolingDown ? `Nudged · ${minutesLeft} min ago` : "Nudge"}
        </button>
      </div>
    </div>
  );
}
