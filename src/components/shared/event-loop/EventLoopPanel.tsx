/**
 * EventLoopPanel.tsx — Main Event Loop interface.
 *
 * Norman principles applied at panel level:
 *   Visibility — Sprint health signal appears before any content.
 *   Affordance — Tabs describe the action, not just the location.
 *   Feedback   — Sprint signal band changes colour with sprint state.
 *   Mapping    — Amber badge count tells user exactly how many decisions wait.
 */

import React, { useState, useCallback } from "react";
import { useApi } from "@/lib/hooks/shared/use-api";
import { PlanService } from "@/lib/services";
import { todayISO } from "@/utils/shared/date.utils";
import { cn } from "@/utils";
import { ELHome }            from "./ELHome";
import { ELMyTasks }         from "./ELMyTasks";
import { ELTickets }         from "./ELTickets";
import { ELSignal }          from "./ELSignal";
import { PlanNegotiationModal } from "./_components/PlanNegotiationModal";
import type { EventLoopData, DaySignal } from "@/types/shared/event-loop.types";

/* ── Signal class map ───────────────────────────────────────────────────────── */
function sigClasses(signal: DaySignal) {
  switch (signal) {
    case "green": return { pill: "bg-success/10 border border-success/30",   dot: "bg-success",          text: "text-success" };
    case "amber": return { pill: "bg-warning/10 border border-warning/30",   dot: "bg-warning",          text: "text-warning" };
    case "red":   return { pill: "bg-error/10 border border-error/30",       dot: "bg-error",            text: "text-error"   };
    default:      return { pill: "bg-base-200 border border-base-300",       dot: "bg-base-content/40",  text: "text-base-content/40" };
  }
}

/* ── Sprint status bar — always visible, establishes context immediately ─────── */
function SprintStatusBar({ data }: { data: EventLoopData }) {
  const currentDayData = data.sprintHealth.dayBreakdown.find(
    (d) => d.day === data.personalHealth.currentDay
  );
  const signal = currentDayData?.signal ?? "pending";
  const col    = sigClasses(signal);
  const label  = signal === "pending" ? "Pending" : signal.charAt(0).toUpperCase() + signal.slice(1);

  const openActions =
    data.tickets.incoming.length +
    data.tickets.actioned.filter((a) => !a.actionedByLayer3).length;

  return (
    <div className="rounded-t-[10px] px-[22px] py-[14px] flex items-center gap-4 bg-[var(--dt-navy)]">
      {/* Identity */}
      <div className="flex-1">
        <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-[var(--el-label)] mb-1">
          Event Loop
        </div>
        <div className="flex items-baseline gap-[10px]">
          <span className="text-[22px] font-extrabold text-white leading-none">
            {data.sprintLabel}
          </span>
          <span className="text-xs text-[var(--el-label)]">
            {data.personalHealth.currentDay} of {data.personalHealth.sprintDays}
          </span>
        </div>
      </div>

      {/* Open actions — only shown when > 0 */}
      {openActions > 0 && (
        <div className="px-[14px] py-[7px] bg-warning/10 border border-warning/30 rounded-md flex items-center gap-2">
          <span className="text-[20px] font-extrabold text-warning leading-none">
            {openActions}
          </span>
          <span className="text-[10px] font-semibold text-warning leading-[1.35]">
            action{openActions !== 1 ? "s" : ""}<br />
            needed
          </span>
        </div>
      )}

      {/* Sprint signal pill */}
      <div className={cn("px-4 py-2 rounded-md flex items-center gap-2", col.pill)}>
        <div
          className={cn(
            "w-[10px] h-[10px] rounded-full shrink-0",
            col.dot,
            signal === "red" ? "dt-pulse-red" : signal === "amber" ? "dt-pulse-amber" : "",
          )}
        />
        <div>
          <div className="text-[8px] font-bold tracking-[0.14em] uppercase text-[var(--el-label)] mb-0.5">
            Sprint Signal
          </div>
          <div className={cn("text-[13px] font-bold leading-none", col.text)}>
            {label}
          </div>
          {signal === "red" && (
            <div className={cn("text-[9px] mt-0.5 opacity-80", col.text)}>
              Sprint under pressure — focus on what&apos;s already committed, escalate the rest
            </div>
          )}
          {signal === "amber" && (
            <div className={cn("text-[9px] mt-0.5 opacity-80", col.text)}>
              Decisions pending
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Tab bar ────────────────────────────────────────────────────────────────── */
interface ELTab { id: string; label: string; badge?: number; urgent?: boolean }

function ELTabBar({ tabs, active, onChange }: {
  tabs: ELTab[]; active: string; onChange: (id: string) => void;
}) {
  return (
    <div className="flex bg-base-200 border-b border-base-300">
      {tabs.map((t) => {
        const isA = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-5 py-[10px] text-xs font-medium cursor-pointer whitespace-nowrap transition-all duration-150",
              "border-none border-r border-base-300 border-b-2",
              isA
                ? "bg-base-100 border-b-primary text-primary font-bold"
                : "bg-transparent border-b-transparent text-neutral hover:text-base-content",
            )}
          >
            {t.label}
            {!!t.badge && t.badge > 0 && (
              <span
                className={cn(
                  "text-[9px] font-extrabold px-1.5 py-0.5 rounded-[10px] leading-[1.4]",
                  t.urgent
                    ? "text-white bg-warning border border-warning/30"
                    : isA
                      ? "text-white bg-primary border border-primary"
                      : "text-warning bg-warning/10 border border-warning/30",
                )}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────────── */
const DAILY_BUDGET_MINS = 480;

export function EventLoopPanel({ data }: { data: EventLoopData }) {
  const [activeTab,       setActiveTab]       = useState("home");
  const [highlightTicket, setHighlightTicket] = useState<string | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [pendingEstMins,  setPendingEstMins]  = useState<number | undefined>(undefined);

  // Daily plan fetch for allocation context
  const { data: dailyTasks = [] } = useApi({
    queryKey: ["daily-plan", todayISO()],
    queryFn:  () => PlanService.getDailyPlan(todayISO()),
  });

  const allocMins = Array.isArray(dailyTasks)
    ? dailyTasks.reduce((s, t) => s + (t.budgetMins ?? 0), 0)
    : 0;
  const currentAllocPct  = Math.round((allocMins / DAILY_BUDGET_MINS) * 100);

  const handleTicketResolved = useCallback((estimatedMins?: number) => {
    const projected = Math.round(((allocMins + (estimatedMins ?? 0)) / DAILY_BUDGET_MINS) * 100);
    if (projected > 80) {
      setPendingEstMins(estimatedMins);
      setIsPlanModalOpen(true);
    }
  }, [allocMins]);

  const allocContext = { allocMins, budgetMins: DAILY_BUDGET_MINS };
  const projectedAllocPct = Math.round(((allocMins + (pendingEstMins ?? 0)) / DAILY_BUDGET_MINS) * 100);

  const myTasksBadge = data.myTasks.filter((t) => t.status === "pending").length;
  const ticketsBadge =
    data.tickets.incoming.length +
    data.tickets.actioned.filter((a) => !a.actionedByLayer3).length;

  const tabs: ELTab[] = [
    { id: "home",    label: "Overview"                                                                         },
    { id: "tickets", label: "Tickets",      badge: ticketsBadge  > 0 ? ticketsBadge  : undefined, urgent: true },
    { id: "mytasks", label: "My Tasks",     badge: myTasksBadge > 0 ? myTasksBadge : undefined               },
    { id: "signal",  label: "Sprint Health"                                                                   },
  ];

  return (
    <div className="flex flex-col rounded-[10px] overflow-hidden border border-base-300">
      <SprintStatusBar data={data} />
      <ELTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div className="bg-base-100 p-[28px] min-h-[540px]">
        {activeTab === "home" && (
          <ELHome
            data={data}
            onQueueItemClick={(id) => { setHighlightTicket(id); setActiveTab("tickets"); }}
          />
        )}
        {activeTab === "mytasks" && (
          <ELMyTasks tasks={data.myTasks} currentDay={data.personalHealth.currentDay} />
        )}
        {activeTab === "tickets" && (
          <ELTickets
            incoming={data.tickets.incoming}
            pending={data.tickets.pending}
            actioned={data.tickets.actioned}
            highlightId={highlightTicket}
            onResolved={handleTicketResolved}
            allocContext={allocContext}
          />
        )}
        {activeTab === "signal" && (
          <ELSignal
            sprintLabel={data.sprintLabel}
            currentDay={data.personalHealth.currentDay}
            dayBreakdown={data.sprintHealth.dayBreakdown}
            ownerBreakdown={data.sprintHealth.ownerBreakdown}
          />
        )}
      </div>
      <PlanNegotiationModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        estimatedMins={pendingEstMins}
        currentAllocPct={currentAllocPct}
        projectedAllocPct={projectedAllocPct}
      />
    </div>
  );
}
