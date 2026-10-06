import { useMemo } from "react";
import { useEventLoop } from "@/lib/hooks/shared/use-event-loop";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { useApi } from "@/lib/hooks/shared/use-api";
import { CascadeService } from "@/lib/services/aavahana/cascade.service";
import { WeeklyPlanService } from "@/lib/services/aavahana/weekly-plan.service";
import { ReportService } from "@/lib/services/aavahana/report.service";
import type { MonthlyBasketItem, TimesheetCategory } from "@/types/aavahana/pdgms.types";
import type {
  ELTask,
  DayBreakdown,
} from "@/types/shared/event-loop.types";

// ─── Derived types for the weekly plan view ──────────────────────────────────

export type DeliverableStatus =
  | "delivered"
  | "pending_qa"
  | "in_progress"
  | "qa_failed"
  | "open"
  | "blocked";

export interface WeeklyDeliverable {
  taskId: string;
  title: string;
  day: string;
  status: DeliverableStatus;
  estimatedMinutes: number | null;
  blockingNote: string | null;
  qaReviewer: string | null;
  qaResult: string | null;
  qaFeedback: string | null;
  isCarryover: boolean;
  isOverdue: boolean;
  isToday: boolean;
}

export interface WeeklyConstraint {
  ticketId: string;
  type: string;
  description: string;
  status: "open" | "classified" | "routed" | "accepted" | "resolved";
  routedTo: string | null;
  nudgeCount: number;
  slaHours: number | null;
  slaBreaching: boolean;
  layer4Decision: string | null;
  layer4Note: string | null;
  actionInstruction: string | null;
  acknowledged: boolean;
}

export interface WeekOverview {
  weekLabel: string;
  sprintLabel: string;
  currentDay: string;
  sprintDays: number;
  tasksDone: number;
  tasksPending: number;
  totalTasks: number;
  plannedMinutes: number;
  qaMet: number;
  qaTotal: number;
  constraintsOpen: number;
  streak: number;
  dayBreakdown: DayBreakdown[];
}

export interface WeeklyPlanData {
  overview: WeekOverview;
  deliverables: WeeklyDeliverable[];
  constraints: WeeklyConstraint[];
  monthlyBasketItems: MonthlyBasketItem[];
  /** Deliverables the SERVER already records as pulled into a week. */
  serverPickedIds: string[];
  isLoading: boolean;
  lastWeekAnalytics: { totalHours: number; categories: TimesheetCategory[] } | null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWeeklyPlanData(): WeeklyPlanData {
  // Header stats (tasks / QA / streak / day breakdown) come from the Event Loop
  // for the user's currently-selected program — not a hardcoded program.
  const { selectedProgram } = useAuth();
  const programId = selectedProgram?.id ?? "";
  const { data: eventLoop, isLoading: elLoading } = useEventLoop(programId);

  const { data: weekInfo } = useApi({
    queryKey: ['current-week'],
    queryFn: () => WeeklyPlanService.getCurrentWeek(),
  });

  const previousWeekStart = useMemo(() => {
    if (!weekInfo?.startDate) return '';
    const d = new Date(weekInfo.startDate + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, [weekInfo?.startDate]);

  const { data: lastWeekReport } = useApi({
    queryKey: ['weekly-report-v4', previousWeekStart],
    queryFn: () => ReportService.getWeeklyReportV4(previousWeekStart),
    enabled: !!previousWeekStart,
  });
  const lastWeekAnalytics = lastWeekReport?.analyticsSnapshot ?? null;

  const weekId = eventLoop?.sprintLabel ?? '';
  const { data: weeklyBasket, isLoading: basketLoading } = useApi({
    queryKey: ['weekly-basket-from-monthly', weekId],
    queryFn: () => CascadeService.getWeeklyBasket(weekId),
    enabled: !!weekId,
  });

  const monthlyBasketItems = useMemo<MonthlyBasketItem[]>(
    () => weeklyBasket?.fromMonthlyPlan ?? [],
    [weeklyBasket]
  );
  const serverPickedIds = useMemo<string[]>(
    () => monthlyBasketItems.filter(i => !!i.pickedIntoWeek).map(i => i.id),
    [monthlyBasketItems]
  );

  // Picking is deliberately NOT owned here any more. It used to PATCH the basket
  // with a monthly deliverable UUID against an integer primary key, which threw
  // on every click — the pick never once landed. The page now routes picks into
  // the weekly editor, and saving the week is what records them.

  const overview = useMemo<WeekOverview>(() => {
    if (!eventLoop) {
      return {
        weekLabel: "",
        sprintLabel: "",
        currentDay: "",
        sprintDays: 0,
        tasksDone: 0,
        tasksPending: 0,
        totalTasks: 0,
        plannedMinutes: 0,
        qaMet: 0,
        qaTotal: 0,
        constraintsOpen: 0,
        streak: 0,
        dayBreakdown: [],
      };
    }

    const ph = eventLoop.personalHealth;
    return {
      weekLabel: eventLoop.sprintLabel,
      sprintLabel: eventLoop.sprintLabel,
      currentDay: ph.currentDay,
      sprintDays: ph.sprintDays,
      tasksDone: ph.tasksDone,
      tasksPending: ph.tasksPending,
      totalTasks: ph.tasksDone + ph.tasksPending,
      plannedMinutes: 0, // TODO: sum from ticket estimatedMinutes when context layer wired
      qaMet: ph.qaMet,
      qaTotal: ph.qaMet + ph.qaPending,
      constraintsOpen: ph.ticketsOpen,
      streak: ph.streak,
      dayBreakdown: eventLoop.sprintHealth.dayBreakdown,
    };
  }, [eventLoop]);

  const deliverables = useMemo<WeeklyDeliverable[]>(() => {
    if (!eventLoop) return [];

    const currentDayNum = parseDayNumber(eventLoop.personalHealth.currentDay);

    return eventLoop.myTasks.map((task: ELTask): WeeklyDeliverable => {
      const taskDayNum = parseDayNumber(task.day);
      const status = mapTaskStatus(task);

      return {
        taskId: task.taskId,
        title: task.task,
        day: task.day,
        status,
        estimatedMinutes: null, // event loop myTasks doesn't carry estimatedMinutes
        blockingNote: task.blockingNote,
        qaReviewer: task.qa.reviewer,
        qaResult: task.qa.result,
        qaFeedback: task.qa.feedback,
        isCarryover: false, // TODO: derive from previous sprint data
        isOverdue: taskDayNum < currentDayNum && status !== "delivered",
        isToday: taskDayNum === currentDayNum,
      };
    });
  }, [eventLoop]);

  const constraints = useMemo<WeeklyConstraint[]>(() => {
    if (!eventLoop) return [];
    const result: WeeklyConstraint[] = [];

    // Incoming constraints (open / classified)
    for (const t of eventLoop.tickets.incoming) {
      result.push({
        ticketId: t.ticketId,
        type: t.type === "break" ? "open" : "flag",
        description: t.context,
        status: t.type === "break" ? "open" : "classified",
        routedTo: null,
        nudgeCount: 0,
        slaHours: null,
        slaBreaching: false,
        layer4Decision: null,
        layer4Note: null,
        actionInstruction: null,
        acknowledged: false,
      });
    }

    // Pending constraints (routed to V4)
    for (const t of eventLoop.tickets.pending) {
      const now = Date.now();
      const sentAt = new Date(t.sentAt).getTime();
      const slaMs = (t.slaHours ?? 24) * 60 * 60 * 1000;
      const slaBreaching = now - sentAt > slaMs;

      result.push({
        ticketId: t.ticketId,
        type: "escalation",
        description: t.escalateRequest,
        status: "routed",
        routedTo: t.sentTo,
        nudgeCount: t.nudgeCount,
        slaHours: t.slaHours ?? null,
        slaBreaching,
        layer4Decision: null,
        layer4Note: null,
        actionInstruction: null,
        acknowledged: false,
      });
    }

    // Actioned constraints (L4 decided)
    for (const t of eventLoop.tickets.actioned) {
      result.push({
        ticketId: t.ticketId,
        type: t.layer4Decision,
        description: t.layer4Note,
        status: t.status === "resolved" ? "resolved" : "accepted",
        routedTo: null,
        nudgeCount: 0,
        slaHours: null,
        slaBreaching: false,
        layer4Decision: t.layer4Decision,
        layer4Note: t.layer4Note,
        actionInstruction: t.actionInstruction,
        acknowledged: t.actionedByLayer3,
      });
    }

    return result;
  }, [eventLoop]);

  return {
    overview, deliverables, constraints,
    monthlyBasketItems, serverPickedIds,
    isLoading: elLoading || basketLoading,
    lastWeekAnalytics,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDayNumber(dayStr: string): number {
  const match = dayStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function mapTaskStatus(task: ELTask): DeliverableStatus {
  if (task.status === "done") return "delivered";
  if (task.qa.result === "not_met") return "qa_failed";
  if (task.qa.result === "met") return "pending_qa";
  if (task.status === "not_done") return "in_progress";
  if (task.blockingNote) return "blocked";
  return "open";
}
