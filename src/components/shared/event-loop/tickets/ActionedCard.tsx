import { useState } from "react";
import { cn } from "@/utils";
import { formatDate } from "@/utils/shared/date.utils";
import type { ActionedTicket, Layer4Decision } from "@/types/shared/event-loop.types";

function decisionClasses(decision: Layer4Decision): { icon: string; text: string; pill: string } {
  switch (decision) {
    case "approved": return { icon: "✓", text: "text-success", pill: "text-success bg-success/10 border border-success/30" };
    case "rejected": return { icon: "✗", text: "text-error",   pill: "text-error bg-error/10 border border-error/30" };
    case "modified": return { icon: "◈", text: "text-primary", pill: "text-primary bg-primary/10 border border-primary/30" };
  }
}

export function ActionedCard({ ticket }: { ticket: ActionedTicket }) {
  const [actioned, setActioned] = useState(ticket.actionedByLayer3);
  const dc = decisionClasses(ticket.layer4Decision);

  return (
    <div
      className={cn(
        "mx-2.5 my-2.5 px-3.5 py-3 border border-base-300 rounded-lg transition-opacity",
        actioned ? "bg-base-200 opacity-70" : "bg-base-100 opacity-100",
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", dc.pill)}>
            {dc.icon} {ticket.layer4Decision.charAt(0).toUpperCase() + ticket.layer4Decision.slice(1)}
          </span>
          <span className="text-[10px] font-semibold text-base-content/70">
            {ticket.ticketId}
          </span>
        </div>
        <span className="text-[10px] text-neutral">
          {ticket.decidedBy} · {formatDate(ticket.decidedAt, "displayTime")}
        </span>
      </div>

      <div className="text-xs text-base-content italic mb-2 leading-[1.45]">
        &ldquo;{ticket.layer4Note}&rdquo;
      </div>

      <div className="text-xs text-base-content/70 mb-2.5 px-2 py-1.5 bg-base-200 border border-base-300 rounded">
        {ticket.actionInstruction}
      </div>

      {!actioned && ticket.layer4Decision !== "rejected" && (
        <div className="text-right">
          <button
            onClick={() => setActioned(true)}
            className="px-4 py-1.5 bg-primary text-white border-none rounded text-xs font-bold cursor-pointer hover:opacity-85 transition-opacity"
          >
            Action It
          </button>
        </div>
      )}
      {!actioned && ticket.layer4Decision === "rejected" && (
        <div className="text-right">
          <button
            onClick={() => setActioned(true)}
            className="px-3.5 py-1.5 bg-transparent text-base-content/70 border border-base-300 rounded text-xs cursor-pointer"
          >
            Acknowledged
          </button>
        </div>
      )}
      {actioned && (
        <div className="text-right text-xs text-neutral">
          ✓ Actioned
        </div>
      )}
    </div>
  );
}


