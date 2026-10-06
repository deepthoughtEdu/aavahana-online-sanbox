import React from "react";
import { cn } from "@/utils";
import { NavyHead } from "./NavyHead";
import type { ActionQueueItem } from "@/types/shared/event-loop.types";

interface Props {
  items:    ActionQueueItem[];
  onSelect: (ticketId: string) => void;
}

export function ActionQueue({ items, onSelect }: Props) {
  const hasItems = items.length > 0;

  return (
    <div
      className={cn(
        "border rounded-md overflow-hidden mb-6",
        hasItems ? "border-warning/30" : "border-success/30",
      )}
    >
      <NavyHead
        label="Action Queue"
        badge={hasItems ? `${items.length} item${items.length === 1 ? "" : "s"} need your attention — each one is tracked and will count toward your logged effort` : "Clean"}
        badgeColor={hasItems ? "var(--dt-amber)" : "var(--dt-green)"}
      />

      {items.length === 0 && (
        <div className="px-4 py-5 bg-success/10 text-center">
          <div className="text-[13px] font-semibold text-success">
            No unplanned work right now.
          </div>
          <div className="text-xs text-neutral mt-1">
            Your plan is running uninterrupted — that&apos;s the goal.
          </div>
        </div>
      )}

      {items.map((item, i) => (
        <button
          key={item.ticketId}
          onClick={() => onSelect(item.ticketId)}
          className={cn(
            "flex items-center w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left gap-3 transition-colors duration-100 hover:bg-base-200 box-border",
            i < items.length - 1 ? "border-b border-base-300" : "",
          )}
        >
          <span className={cn("text-xs font-bold shrink-0 min-w-[54px]", item.type === "return" ? "text-primary" : "text-warning")}>
            {item.ticketId}
          </span>
          <span className="flex-1 text-xs text-base-content">
            {item.summary}
            {item.raisedBy && <span className="text-neutral"> · {item.raisedBy}</span>}
          </span>
          {item.time && (
            <span className="text-xs text-neutral shrink-0">
              {item.time}
            </span>
          )}
          <svg
            width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="shrink-0 text-neutral"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ))}
    </div>
  );
}
