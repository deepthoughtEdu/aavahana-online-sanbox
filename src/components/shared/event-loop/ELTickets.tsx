/**
 * ELTickets.tsx — Event Loop Tab 2: Tickets
 *
 * Three swimlanes simultaneously visible:
 *   Incoming  — Open tickets needing Layer 3 decision (Resolve / Reassign / Escalate)
 *   Pending   — Escalations awaiting Layer 4 approval (Nudge, rate-limited)
 *   Actioned  — Resolved tickets and returned Layer 4 decisions (Action It / Acknowledged)
 */

import { cn } from "@/utils";
import type { IncomingTicket, PendingTicket, ActionedTicket } from "@/types/shared/event-loop.types";
import { SwimHead, SwimEmpty } from "./tickets/SwimlanePrimitives";
import { IncomingCard } from "./tickets/IncomingCard";
import { PendingCard } from "./tickets/PendingCard";
import { ActionedCard } from "./tickets/ActionedCard";

interface ELTicketsProps {
  incoming:     IncomingTicket[];
  pending:      PendingTicket[];
  actioned:     ActionedTicket[];
  highlightId:  string | null;
  onResolved?:  (estimatedMins?: number) => void;
  allocContext?: { allocMins: number; budgetMins: number };
}

export function ELTickets({ incoming, pending, actioned, highlightId, onResolved, allocContext }: ELTicketsProps) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 items-start">
        {/* Swimlane 1 — Incoming (needs decision) */}
        <div className={cn("bg-base-100 rounded-md overflow-hidden border", incoming.length > 0 ? "border-[var(--dt-navyMid)]" : "border-base-300")}>
          <SwimHead
            label="Incoming"
            count={incoming.length}
            subtitle="Resolve · Reassign · Escalate"
            urgent={incoming.length > 0}
          />
          {incoming.length === 0
            ? <SwimEmpty label="No open tickets" />
            : incoming.map((t) => (
                <IncomingCard key={t.ticketId} ticket={t} highlightId={highlightId} onResolved={onResolved} allocContext={allocContext} />
              ))
          }
        </div>

        {/* Swimlane 2 — Pending (awaiting Layer 4) */}
        <div className={cn("bg-base-100 rounded-md overflow-hidden border", pending.length > 0 ? "border-[var(--dt-navyMid)]" : "border-base-300")}>
          <SwimHead
            label="Pending"
            count={pending.length}
            subtitle="Awaiting Layer 4 decision"
          />
          {pending.length === 0
            ? <SwimEmpty label="No escalations waiting" />
            : pending.map((t) => <PendingCard key={t.ticketId} ticket={t} />)
          }
        </div>

        {/* Swimlane 3 — Actioned */}
        <div className="bg-base-100 rounded-md overflow-hidden border border-base-300">
          <SwimHead
            label="Actioned"
            count={actioned.length}
            subtitle="Resolved or acknowledged"
          />
          {actioned.length === 0
            ? <SwimEmpty label="No actioned tickets" />
            : actioned.map((t) => <ActionedCard key={t.ticketId} ticket={t} />)
          }
        </div>
      </div>
    </div>
  );
}
