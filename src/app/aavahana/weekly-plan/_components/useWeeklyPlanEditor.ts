"use client";

// Drives the editable weekly plan on the Weekly Plan screen: the deliverable
// tasks (grouped by day) AND the risks/blockers. On arrival from "Plan Your
// Week" (a stashed intent) it runs the BYOK AI generation (showing a "creating
// your plan" state), fills both lists, and AUTO-SAVES so the plan survives a
// reload. Otherwise it loads the saved plan. The user can keep editing and
// re-save; the plan stays editable through the week (re-saving overwrites).

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { WeeklyPlanService } from "@/lib/services/aavahana/weekly-plan.service";
import { isError } from "@/lib/api/client";
import {
  byokConfigAtom,
  byokConfiguredAtom,
  normalizeByokModel,
} from "@/lib/store/shared/byok.store";
import { consumeWeeklyPlanGenerate } from "@/lib/store/shared/weekly-plan-generate";
import { toast } from "@/utils";
import { showInsightToast } from "@/lib/aavahana/insight-toast";
import type { PlanTask } from "@/types/aavahana/weekly-plan-editor.types";
import type { SubmitInsight } from "@/types/aavahana/insight.types";

let seq = 0;
const newId = (prefix = "item") => `${prefix}-${(seq += 1)}`;

const VALID_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
function normDay(d: unknown): string | null {
  if (!d) return null;
  const three = String(d).trim().toLowerCase().slice(0, 3);
  return VALID_DAYS.includes(three) ? three : null;
}

type LabelledRow = { id?: string | number; sourceItemId?: string; label?: string; title?: string; day?: string | null };

function toRows(rows: LabelledRow[] | undefined, prefix: string): PlanTask[] {
  return (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      id: String(r.id ?? newId(prefix)),
      // Only a row that arrived with an id has one on the server. Locally
      // invented ids must not be echoed back as if the server issued them.
      serverId: r.id != null ? String(r.id) : undefined,
      sourceItemId: r.sourceItemId != null ? String(r.sourceItemId) : undefined,
      label: String(r.label ?? r.title ?? ""),
      day: normDay(r.day),
    }))
    .filter((t) => t.label);
}

const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri"];

// Fallback for a lazy/weak AI that leaves tasks unscheduled: spread the
// day-less tasks round-robin across Mon–Fri (filling the lightest day), keeping
// any day the AI did assign. Balances the week without dropping tasks.
function balanceDays(tasks: PlanTask[]): PlanTask[] {
  const counts: Record<string, number> = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 };
  for (const t of tasks) {
    if (t.day && counts[t.day] != null) counts[t.day] += 1;
  }
  return tasks.map((t) => {
    if (t.day && WEEK_DAYS.includes(t.day)) return t;
    let best = WEEK_DAYS[0];
    for (const d of WEEK_DAYS) if (counts[d] < counts[best]) best = d;
    counts[best] += 1;
    return { ...t, day: best };
  });
}

export interface UseWeeklyPlanEditor {
  tasks: PlanTask[];
  risks: PlanTask[];
  isLoading: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  dirty: boolean;
  byokConfigured: boolean;
  updateTask: (id: string, label: string) => void;
  updateTaskDay: (id: string, day: string | null) => void;
  addTask: (day?: string | null) => void;
  addTaskFromMonthly: (item: { sourceItemId?: string; id: string; title: string; targetWeek?: string | null }) => void;
  removeTaskBySourceItem: (sourceItemId: string) => void;
  removeTask: (id: string) => void;
  updateRisk: (id: string, label: string) => void;
  addRisk: () => void;
  removeRisk: (id: string) => void;
  save: () => Promise<void>;
}

export function useWeeklyPlanEditor(): UseWeeklyPlanEditor {
  const byok = useAtomValue(byokConfigAtom);
  const byokConfigured = useAtomValue(byokConfiguredAtom);

  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [risks, setRisks] = useState<PlanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const weekStartRef = useRef<string | undefined>(undefined);
  const ranRef = useRef(false);

  // Persist the given lists. status "empty" = no tasks to save. `insight` is
  // the variable-reward insight the backend returns on a successful save (F2).
  const persist = useCallback(
    async (
      taskList: PlanTask[],
      riskList: PlanTask[],
    ): Promise<{ status: "ok" | "empty" | "error" | "cascade-error"; insight: SubmitInsight | null }> => {
      // Round-trip the server id so the backend can match a task it already
      // knows even after a rename. Without it the server falls back to matching
      // on the label, and a renamed task loses its done state and time blocks.
      const items = taskList
        .map((t) => ({ id: t.serverId, sourceItemId: t.sourceItemId, title: t.label.trim(), day: normDay(t.day) }))
        .filter((i) => i.title);
      if (items.length === 0) return { status: "empty", insight: null };
      const riskItems = riskList
        .map((r) => ({ title: r.label.trim() }))
        .filter((i) => i.title);
      const res = await WeeklyPlanService.saveWeeklyPlan({
        weekStart: weekStartRef.current,
        items,
        risks: riskItems,
      });
      if (isError(res)) return { status: "error", insight: null };
      if (res.cascade?.error) return { status: "cascade-error", insight: null };
      return { status: "ok", insight: res.insight ?? null };
    },
    [],
  );

  const loadSaved = useCallback(async (weekStart?: string) => {
    setIsLoading(true);
    const res = await WeeklyPlanService.getWeeklyPlan(weekStart);
    setIsLoading(false);
    if (isError(res) || !res) {
      setTasks([]);
      setRisks([]);
      return;
    }
    setTasks(toRows(res.deliverables, "task"));
    setRisks(toRows(res.risks, "risk"));
    setDirty(false);
  }, []);

  const runGenerate = useCallback(
    async (intent: string) => {
      if (!byokConfigured) {
        toast.error("Add your AI key in Settings → AI Coach to generate a plan.");
        await loadSaved(weekStartRef.current);
        return;
      }
      setIsLoading(false);
      setIsGenerating(true);
      try {
        const res = await WeeklyPlanService.generateAiPlan({
          weekStart: weekStartRef.current,
          intent,
          apiKey: byok.apiKey,
          provider: byok.provider,
          model: normalizeByokModel(byok.model),
        });
        if (isError(res)) {
          await loadSaved(weekStartRef.current);
          return;
        }
        const nextTasks: PlanTask[] = (res.draft?.deliverables ?? [])
          .filter((d) => d && d.label)
          .map((d) => ({ id: newId("task"), label: d.label, day: normDay(d.day) }));
        const nextRisks: PlanTask[] = (res.draft?.risks ?? [])
          .filter((r) => r && r.title)
          .map((r) => ({ id: newId("risk"), label: r.title }));
        if (nextTasks.length === 0 && nextRisks.length === 0) {
          toast.error("The AI didn't return a plan — try rephrasing on Plan Your Week.");
          await loadSaved(weekStartRef.current);
          return;
        }
        const balanced = balanceDays(nextTasks);
        setTasks(balanced);
        setRisks(nextRisks);
        // Auto-save so the generated plan survives a reload.
        const result = await persist(balanced, nextRisks);
        if (result.status === "ok") {
          setDirty(false);
          toast.success("Plan generated and saved");
          showInsightToast(result.insight);
        } else {
          setDirty(true);
          if (result.status === "error") toast.error("Generated, but saving failed. Edit and Save plan.");
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [byok, byokConfigured, loadSaved, persist],
  );

  // On mount: generate if the input screen handed off an intent, else load saved.
  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    const request = consumeWeeklyPlanGenerate();
    weekStartRef.current = request?.weekStart;
    if (request) {
      void runGenerate(request.intent || "");
    } else {
      void loadSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateTask = useCallback((id: string, label: string) => {
    setDirty(true);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));
  }, []);
  const updateTaskDay = useCallback((id: string, day: string | null) => {
    setDirty(true);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, day: normDay(day) } : t)));
  }, []);
  const addTask = useCallback((day?: string | null) => {
    setDirty(true);
    setTasks((prev) => [...prev, { id: newId("task"), label: "", day: normDay(day) }]);
  }, []);
  const removeTask = useCallback((id: string) => {
    setDirty(true);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Pull a deliverable down from the monthly plan.
   *
   * Picking is an editor action, not a basket PATCH. The old path called
   * updateBasketItem with a monthly deliverable UUID against an integer primary
   * key, so it threw on every click and never once recorded a pick. The pick is
   * now just a task carrying `sourceItemId`, and saving the week is what writes
   * the cascade row.
   */
  const addTaskFromMonthly = useCallback(
    (item: { sourceItemId?: string; id: string; title: string; targetWeek?: string | null }) => {
      const sourceItemId = item.sourceItemId ?? String(item.id).replace(/^monthly-/, "");
      setDirty(true);
      setTasks((prev) => {
        // Picking the same deliverable twice into one week is a mis-click.
        if (prev.some((t) => t.sourceItemId === sourceItemId)) return prev;
        return [...prev, {
          id: newId("task"),
          label: item.title,
          day: null,
          sourceItemId,
        }];
      });
    },
    [],
  );

  /** Drop a monthly pick back out of the week. */
  const removeTaskBySourceItem = useCallback((sourceItemId: string) => {
    setDirty(true);
    setTasks((prev) => prev.filter((t) => t.sourceItemId !== sourceItemId));
  }, []);

  const updateRisk = useCallback((id: string, label: string) => {
    setDirty(true);
    setRisks((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r)));
  }, []);
  const addRisk = useCallback(() => {
    setDirty(true);
    setRisks((prev) => [...prev, { id: newId("risk"), label: "" }]);
  }, []);
  const removeRisk = useCallback((id: string) => {
    setDirty(true);
    setRisks((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await persist(tasks, risks);
      if (result.status === "empty") {
        toast.error("Add at least one task before saving.");
        return;
      }
      if (result.status === "ok") {
        setDirty(false);
        toast.success("Plan saved");
        // Variable reward (F2): surface the rotating insight the save returned.
        showInsightToast(result.insight);
      } else if (result.status === "cascade-error") {
        toast.error("Plan saved, but daily tasks could not be updated. Please save again.");
      } else {
        toast.error("Couldn't save your plan. Try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }, [tasks, risks, persist]);

  return {
    tasks,
    risks,
    isLoading,
    isGenerating,
    isSaving,
    dirty,
    byokConfigured,
    updateTask,
    updateTaskDay,
    addTask,
    addTaskFromMonthly,
    removeTaskBySourceItem,
    removeTask,
    updateRisk,
    addRisk,
    removeRisk,
    save,
  };
}
