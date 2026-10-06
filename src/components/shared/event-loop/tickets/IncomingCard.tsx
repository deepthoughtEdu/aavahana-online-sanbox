import { useState } from "react";
import { cn } from "@/utils";
import { formatDate } from "@/utils/shared/date.utils";
import type { IncomingTicket } from "@/types/shared/event-loop.types";
import { DownstreamRisk } from "./SwimlanePrimitives";

interface IncomingCardState {
  action:              "none" | "resolve" | "reassign" | "escalate";
  noteText:            string;
  proposedResolution:  string;
  resolved:            boolean;
}

export function IncomingCard({
  ticket,
  highlightId,
  onResolved,
  allocContext,
}: {
  ticket:       IncomingTicket;
  highlightId:  string | null;
  onResolved?:  (estimatedMins?: number) => void;
  allocContext?: { allocMins: number; budgetMins: number };
}) {
  const [state, setState] = useState<IncomingCardState>({
    action: "none", noteText: "", proposedResolution: "", resolved: false,
  });

  const isHighlighted = highlightId === ticket.ticketId;

  if (state.resolved) {
    return (
      <div className="mx-2.5 my-2.5 px-3 py-2.5 bg-success/10 border border-success/30 rounded-lg text-xs text-success">
        ✓ Resolved — time credited to your daily report as coordination
      </div>
    );
  }

  const canSubmit = state.noteText.trim() && (state.action !== "escalate" || state.proposedResolution.trim().length >= 15);

  return (
    <div
      className={cn(
        "mx-2.5 my-2.5 px-3.5 py-3 border rounded-lg transition-colors duration-300",
        isHighlighted ? "bg-warning/10 border-warning/30" : "bg-base-100 border-base-300",
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="text-[10px] font-bold text-warning">
            {ticket.ticketId}
          </span>
          <span className="text-[10px] text-neutral ml-1.5">
            {ticket.taskId}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-neutral">{ticket.raisedBy}</span>
          <div className="text-[9px] text-base-content/40">
            {formatDate(ticket.timestamp, "displayTime")}
          </div>
        </div>
      </div>

      {/* Plan disruption banner */}
      {ticket.estimatedMins != null && ticket.estimatedMins > 0 && allocContext && (
        <div className="text-xs text-warning mb-2">
          ⏱ Est. ~{ticket.estimatedMins}min · Your day: {Math.round(allocContext.allocMins / allocContext.budgetMins * 100)}% → {Math.round((allocContext.allocMins + ticket.estimatedMins) / allocContext.budgetMins * 100)}%
        </div>
      )}

      {/* Context */}
      <div className="text-xs text-base-content leading-[1.45] mb-1.5">
        {ticket.context}
      </div>

      <DownstreamRisk tasks={ticket.downstreamRisk} />

      {/* Inline action fields */}
      {state.action !== "none" && (
        <div className="mt-3">
          <input
            type="text"
            value={state.noteText}
            onChange={(e) => setState((s) => ({ ...s, noteText: e.target.value }))}
            placeholder={
              state.action === "resolve"  ? "What did you do" :
              state.action === "reassign" ? "New owner and reason" :
              "Decision needed from Layer 4"
            }
            autoFocus
            className="w-full px-2.5 py-2 bg-base-200 border border-base-300 rounded-md text-xs text-base-content outline-none box-border"
          />
          {/* Proposed Resolution — required for escalate */}
          {state.action === "escalate" && (
            <div className="mt-2">
              <div className="text-[10px] font-bold text-warning mb-1 flex gap-1.5">
                <span>Proposed Resolution</span>
                <span className="font-normal text-neutral">(required — min 15 chars)</span>
              </div>
              <textarea
                value={state.proposedResolution}
                onChange={(e) => setState((s) => ({ ...s, proposedResolution: e.target.value }))}
                placeholder="Describe what you propose as a resolution before escalating…"
                rows={3}
                className={cn(
                  "w-full px-2.5 py-2 bg-warning/10 border rounded-md text-xs text-base-content outline-none box-border resize-y",
                  state.proposedResolution.trim().length >= 15 ? "border-warning/30" : "border-error/30",
                )}
              />
              {state.proposedResolution.trim().length < 15 && state.proposedResolution.length > 0 && (
                <div className="text-[10px] text-error mt-0.5">
                  {15 - state.proposedResolution.trim().length} more character{15 - state.proposedResolution.trim().length !== 1 ? "s" : ""} needed
                </div>
              )}
            </div>
          )}
          <div className="flex gap-1.5 mt-2 justify-end">
            <button
              onClick={() => setState({ action: "none", noteText: "", proposedResolution: "", resolved: false })}
              className="px-2.5 py-1 bg-transparent text-neutral border border-base-300 rounded text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => { if (canSubmit) { setState((s) => ({ ...s, resolved: true })); onResolved?.(ticket.estimatedMins); } }}
              disabled={!canSubmit}
              className={cn(
                "px-3.5 py-1 border-none rounded text-xs font-bold",
                canSubmit ? "bg-primary text-white cursor-pointer" : "bg-base-200 text-neutral cursor-default",
              )}
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {state.action === "none" && (
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => setState((s) => ({ ...s, action: "resolve" }))}
            className="px-4 py-1.5 bg-primary text-white border-none rounded-md text-xs font-bold cursor-pointer hover:opacity-85 transition-opacity"
          >
            Resolve
          </button>
          <button
            onClick={() => setState((s) => ({ ...s, action: "reassign" }))}
            className="px-3.5 py-1.5 bg-transparent text-base-content/70 border border-base-300 rounded-md text-xs cursor-pointer"
          >
            Reassign
          </button>
          <button
            onClick={() => setState((s) => ({ ...s, action: "escalate" }))}
            className="px-3.5 py-1.5 bg-transparent text-warning border border-warning/30 rounded-md text-xs cursor-pointer"
          >
            Escalate
          </button>
        </div>
      )}
    </div>
  );
}
