import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { PlanService } from "@/lib/services";
import { CascadeService } from "@/lib/services/aavahana/cascade.service";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { formatDate, addTime, todayISO as getTodayISO } from "@/utils/shared/date.utils";
import { queryClient } from "@/lib/query/client";
import { toast } from "@/utils";
import { logger } from "@/lib/managers/logger";
import type { DailyTask } from "@/types";
import type { BasketItem } from "@/types/mimamsaka/plan-cascade.types";
import { showInsightToast } from "@/lib/aavahana/insight-toast";

export interface UseDailyPlanReturn {
  currentDate: string;
  todayISO: string;
  isToday: boolean;
  goToPrevDay: () => void;
  goToNextDay: () => void;
  jumpToDate: (isoDate: string) => void;

  todayTasks: DailyTask[];
  /** Total estimated minutes across today's tasks (for the workload bar). */
  plannedMins: number;
  isPlanSubmitted: boolean;
  isLoading: boolean;

  weeklyBasketItems: BasketItem[];
  eventLoopItems: BasketItem[];
  carryoverItems: BasketItem[];
  yesterdayCarryovers: DailyTask[];

  pickFromBasket: (item: BasketItem) => void;
  unpickFromBasket: (basketItemId: string) => void;
  addTask: (task: DailyTask) => void;
  removeTask: (index: number) => void;
  updateTask: (index: number, updates: Partial<DailyTask>) => void;
  markCriticalPath: (index: number) => void;
  updateEstimate: (index: number, mins: number) => void;

  submitPlan: () => Promise<void>;
  isSubmitting: boolean;
}

export function useDailyPlan(): UseDailyPlanReturn {
  const [currentDate, setCurrentDate] = useState(getTodayISO());
  const todayDate = getTodayISO();
  const isToday = currentDate === todayDate;

  // ── Data fetches ────────────────────────────────────────────────

  const {
    data: existingPlan = [],
    isLoading: planLoading,
    refetch: refetchPlan,
  } = useApi({
    queryKey: ["daily-plan", currentDate],
    queryFn: () => PlanService.getDailyPlan(currentDate),
  });

  const { data: dailyBasket } = useApi({
    queryKey: ["daily-basket", currentDate],
    queryFn: () => CascadeService.getDailyBasket(currentDate),
    enabled: isToday,
  });

  const { data: yesterdayData } = useApi({
    queryKey: ["yesterday-plan"],
    queryFn: PlanService.yesterdayPlan,
    enabled: isToday,
  });

  // ── Derived state ──────────────────────────────────────────────

  const isPlanSubmitted = Array.isArray(existingPlan) && existingPlan.length > 0;
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [seededDate, setSeededDate] = useState<string>("");

  // Seed local task state from the server-fetched plan exactly once per date.
  // Must wait for planLoading to be false — otherwise the default `existingPlan = []`
  // (returned by useApi while in-flight) would trip the "no plan" branch and
  // mark the date as seeded before the real data arrives, leaving todayTasks empty.
  useEffect(() => {
    if (planLoading) return;
    if (seededDate === currentDate) return;

    if (Array.isArray(existingPlan) && existingPlan.length > 0) {
      setTodayTasks(existingPlan);
    } else {
      setTodayTasks((prev) => (prev.length === 0 ? prev : []));
    }
    setSeededDate(currentDate);
  }, [planLoading, existingPlan, currentDate, seededDate]);

  const weeklyBasketItems = useMemo(
    () => dailyBasket?.fromWeeklyPlan?.filter((i) => i.status === "available") ?? [],
    [dailyBasket],
  );
  const eventLoopItems = useMemo(
    () => dailyBasket?.fromEventLoop?.filter((i) => i.status === "available") ?? [],
    [dailyBasket],
  );
  const carryoverItems = useMemo(
    () => dailyBasket?.selfAdded?.filter((i) => i.status === "available") ?? [],
    [dailyBasket],
  );

  const yesterdayCarryovers = useMemo(() => {
    const arr = yesterdayData ?? [];
    return arr.filter(
      (yesterdayTask) => !todayTasks.some((t) => t.text === yesterdayTask.text),
    );
  }, [yesterdayData, todayTasks]);

  // Total estimated minutes across today's tasks — the single source for the
  // workload bar (previously reduced inline in several places).
  const plannedMins = useMemo(
    () => todayTasks.reduce((sum, t) => sum + (Number(t.budgetMins) || 0), 0),
    [todayTasks],
  );

  // ── Date navigation ────────────────────────────────────────────

  const goToPrevDay = useCallback(() => {
    setCurrentDate((prev) => formatDate(addTime(prev, -1, "day"), "YYYY-MM-DD"));
    setSeededDate("");
  }, []);

  const goToNextDay = useCallback(() => {
    if (!isToday) {
      setCurrentDate((prev) => formatDate(addTime(prev, 1, "day"), "YYYY-MM-DD"));
      setSeededDate("");
    }
  }, [isToday]);

  const jumpToDate = useCallback(
    (isoDate: string) => {
      // Never allow navigating to a future date — you can only review past
      // days and plan today.
      if (isoDate > todayDate) return;
      setCurrentDate(isoDate);
      setSeededDate("");
    },
    [todayDate],
  );

  // ── Mutations ──────────────────────────────────────────────────

  const pickFromBasket = useCallback((item: BasketItem) => {
    const task: DailyTask = {
      text: item.label,
      status: "notStarted",
      type: "planned",
      source: item.source === "eventLoop" ? "event_loop" : "weekly_basket",
      sourceId: item.sourceRefId,
      budgetMins: item.quantity,
      isCriticalPath: false,
      basketItemId: item.id,
      programId: item.programId,
    };
    setTodayTasks((prev) => [...prev, task]);
    CascadeService.updateBasketItem(item.id, { status: "picked" });
  }, []);

  const unpickFromBasket = useCallback((basketItemId: string) => {
    setTodayTasks((prev) => prev.filter((t) => t.basketItemId !== basketItemId));
    CascadeService.updateBasketItem(basketItemId, { status: "available" });
  }, []);

  const addTask = useCallback((task: DailyTask) => {
    setTodayTasks((prev) => [...prev, task]);
  }, []);

  const removeTask = useCallback((index: number) => {
    setTodayTasks((prev) => {
      const task = prev[index];
      if (task?.basketItemId) {
        CascadeService.updateBasketItem(task.basketItemId, { status: "available" });
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateTask = useCallback((index: number, updates: Partial<DailyTask>) => {
    setTodayTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...updates } : t)));
  }, []);

  const markCriticalPath = useCallback((index: number) => {
    setTodayTasks((prev) =>
      prev.map((t, i) => ({
        ...t,
        isCriticalPath: i === index,
      })),
    );
  }, []);

  const updateEstimate = useCallback((index: number, mins: number) => {
    setTodayTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, budgetMins: mins, estimateMins: mins } : t)),
    );
  }, []);

  // ── Draft auto-save (5s debounce + visibilitychange) ──────────
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const saveDraft = useCallback(() => {
    if (!isToday || todayTasks.length === 0) return;
    const stateStr = JSON.stringify(todayTasks);
    if (stateStr === lastSavedRef.current) return;
    lastSavedRef.current = stateStr;
    try {
      localStorage.setItem(`daily-plan-draft-${currentDate}`, stateStr);
    } catch {
      // localStorage full or unavailable — silent
    }
  }, [isToday, todayTasks, currentDate]);

  useEffect(() => {
    if (!isToday || todayTasks.length === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveDraft, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [todayTasks, isToday, saveDraft]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") saveDraft();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [saveDraft]);

  // ── Submit ─────────────────────────────────────────────────────
  const submitMutation = useApiMutation({
    mutationFn: PlanService.submitDailyPlan,
    onSuccess: (result) => {
      showInsightToast(result?.insight);
      refetchPlan();
      queryClient.invalidateQueries({ queryKey: ["report", currentDate] });
      // The daily report reads the plan through its own keys — mark them stale
      // so navigating plan → report shows the just-submitted plan without a
      // hard reload (5-min default staleTime would otherwise serve the old
      // "no plan" / old-tasks snapshot).
      queryClient.invalidateQueries({ queryKey: ["daily-plan", currentDate] });
      queryClient.invalidateQueries({
        queryKey: ["v7-deliverables", currentDate],
      });
    },
    onError: (error) => {
      logger.error("Submit error", error);
      toast.error(error.message || "Failed to submit plan");
    },
  });

  const submitPlan = useCallback(async () => {
    if (todayTasks.length === 0) {
      toast.error("Please add at least one task");
      return;
    }
    await submitMutation.mutateAsync({ plan: todayTasks });
  }, [submitMutation, todayTasks]);

  return {
    currentDate,
    todayISO: todayDate,
    isToday,
    goToPrevDay,
    goToNextDay,
    jumpToDate,
    todayTasks,
    plannedMins,
    isPlanSubmitted,
    // Only the core plan fetch gates the full-page spinner. The daily basket is
    // a secondary panel (and is disabled on past dates), so letting it block the
    // whole screen could leave it spinning forever when navigating between days.
    isLoading: planLoading,
    weeklyBasketItems,
    eventLoopItems,
    carryoverItems,
    yesterdayCarryovers,
    pickFromBasket,
    unpickFromBasket,
    addTask,
    removeTask,
    updateTask,
    markCriticalPath,
    updateEstimate,
    submitPlan,
    isSubmitting: submitMutation.isPending,
  };
}
