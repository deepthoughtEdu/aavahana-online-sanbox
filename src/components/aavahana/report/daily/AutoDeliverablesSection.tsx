"use client";

import { cn } from "@/utils";
import { Badge } from "@/components/shared/Badge";
import type { AutoDeliverable } from "@/types";

interface AutoDeliverablesSectionProps {
  deliverables: AutoDeliverable[];
  className?: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "info"> = {
  delivered: "success",
  pending_qa: "warning",
  in_progress: "info",
};

const STATUS_LABEL: Record<string, string> = {
  delivered: "Delivered",
  pending_qa: "Pending QA",
  in_progress: "In Progress",
};

/**
 * Read-only section showing auto-populated deliverables from ticket state changes.
 * Module 2 (Daily Report) — NEW per PDGMS v4.0 A72.
 */
export function AutoDeliverablesSection({
  deliverables,
  className,
}: AutoDeliverablesSectionProps) {
  if (deliverables.length === 0) {
    return (
      <div className={cn("opacity-40 text-sm text-center py-3", className)}>
        No ticket state changes detected today.
      </div>
    );
  }

  // Group by program
  const byProgram = deliverables.reduce<Record<string, AutoDeliverable[]>>(
    (acc, d) => {
      if (!acc[d.programId]) acc[d.programId] = [];
      acc[d.programId].push(d);
      return acc;
    },
    {}
  );

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium opacity-70">
        Auto-populated Deliverables
        <Badge variant="ghost" size="sm" icon={null} label="read-only" className="ml-2" />
      </p>
      {Object.entries(byProgram).map(([programId, items]) => (
        <div key={programId} className="space-y-1">
          <p className="text-xs opacity-40 uppercase tracking-wide">{programId}</p>
          {items.map((item) => (
            <div
              key={item.ticketId}
              className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2"
            >
              <Badge
                variant={STATUS_VARIANT[item.status] ?? "ghost"}
                size="sm"
                icon={null}
                label={STATUS_LABEL[item.status] ?? item.status}
              />
              <span className="text-sm flex-1">{item.label}</span>
              <span className="text-xs opacity-30">#{item.ticketId}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
