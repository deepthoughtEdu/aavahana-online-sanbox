'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MonthlyPlanService } from '@/lib/services/aavahana/monthly-plan.service';
import { useApi } from '@/lib/hooks/shared/use-api';
import { queryClient } from '@/lib/query/client';
import type {
  MonthlyPlanData,
  MonthlyPlanDeliverable,
  MonthlyIPGoal,
  ProgramKPI,
  RecurringEvent,
  MonthlyFeedbackFlag,
  MonthlyPlanContext,
  IpItemOption,
} from '@/types/aavahana/monthly-plan.types';
import type { MonthlyBasketItem } from '@/types';

const DEFAULT_PROGRAM_ID = '1';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

interface UseMonthlyPlanReturn {
  plan: MonthlyPlanData | null;
  isLoading: boolean;
  error: string | null;
  basketItems: MonthlyBasketItem[];
  carryovers: MonthlyPlanDeliverable[];
  programKPIs: ProgramKPI[];
  ipItems: IpItemOption[];
  deliverables: MonthlyPlanDeliverable[];
  ipGoals: MonthlyIPGoal[];
  acceptBasketItem: (item: MonthlyBasketItem) => void;
  acceptCarryover: (item: MonthlyPlanDeliverable) => void;
  deferDeliverable: (itemId: string) => void;
  dropDeliverable: (itemId: string) => void;
  addDeliverable: (item: Omit<MonthlyPlanDeliverable, 'id' | 'status' | 'isCarryover' | 'originalDeadline' | 'deferredTo'>) => void;
  updateEstimate: (itemId: string, hours: number) => void;
  updateDeliverable: (itemId: string, updates: Partial<MonthlyPlanDeliverable>) => void;
  kpiTargets: Record<string, number | null>;
  setKpiTarget: (kpiId: string, value: number | null) => void;
  feedback: MonthlyFeedbackFlag[];
  context?: MonthlyPlanContext;
  addIPGoal: (goal: Omit<MonthlyIPGoal, 'id'>) => void;
  removeIPGoal: (goalId: string) => void;
  updateIPGoal: (goalId: string, updates: Partial<MonthlyIPGoal>) => void;
  recurringEvents: RecurringEvent[];
  weeklyRecurringHours: number;
  addRecurringEvent: (event: Omit<RecurringEvent, 'id' | 'isActive'>) => Promise<void>;
  updateRecurringEvent: (eventId: string, updates: Partial<RecurringEvent>) => Promise<void>;
  removeRecurringEvent: (eventId: string) => Promise<void>;
  submitPlan: () => Promise<void>;
  isSubmitting: boolean;
  saveDraft: () => Promise<void>;
}

export function useMonthlyPlan(month: string, programId: string = DEFAULT_PROGRAM_ID): UseMonthlyPlanReturn {
  // ── Data fetches ────────────────────────────────────────────────
  const { data: plan = null, isLoading: planLoading, refetch } = useApi({
    queryKey: ['monthly-plan', month],
    queryFn: () => MonthlyPlanService.getCurrentPlan(month),
    enabled: !!month,
  });

  const { data: basketItems = [] } = useApi({
    queryKey: ['monthly-basket', month],
    queryFn: () => MonthlyPlanService.getBasket(month),
    enabled: !!month,
  });

  const { data: carryovers = [] } = useApi({
    queryKey: ['monthly-carryovers', month],
    queryFn: () => MonthlyPlanService.getCarryovers(month),
    enabled: !!month,
  });

  const { data: programKPIs = [] } = useApi({
    queryKey: ['program-kpis', programId],
    queryFn: () => MonthlyPlanService.getProgramKPIs(programId),
  });

  // IP registry items, for the goal picker. Axis 2 binds a goal to a real
  // IpItem so the server can derive maturity from its verified commit count.
  const { data: ipItems = [] } = useApi({
    queryKey: ['ip-items'],
    queryFn: () => MonthlyPlanService.getIpItems(),
  });

  // ── Recurring events (backend-synced) ────────────────────────────
  const { data: recurringEvents = [] } = useApi({
    queryKey: ['recurring-events', plan?.id],
    queryFn: () => MonthlyPlanService.getRecurringEvents(plan!.id),
    enabled: !!plan?.id,
  });

  // ── Local mutable state ──────────────────────────────────────────
  const [deliverables, setDeliverables] = useState<MonthlyPlanDeliverable[]>([]);
  const [ipGoals, setIPGoals] = useState<MonthlyIPGoal[]>([]);
  // Spec Axis 3: the employee's individual commit against each shared program
  // KPI, keyed by kpiId. Kept separate from programKPIs, which is org config.
  const [kpiTargets, setKpiTargets] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (plan) {
      setDeliverables(plan.deliverables);
      setIPGoals(plan.ipGoals);
      const stored: Record<string, number | null> = {};
      for (const t of plan.kpiTargets ?? []) {
        if (t?.kpiId != null && t.myTarget != null) stored[String(t.kpiId)] = t.myTarget;
      }
      setKpiTargets(stored);
    }
  }, [plan]);

  // ── Auto-create on first visit ──────────────────────────────────
  const [autoCreated, setAutoCreated] = useState(false);
  useEffect(() => {
    if (!planLoading && !plan && !autoCreated && month) {
      setAutoCreated(true);
      MonthlyPlanService.createPlan({
        month,
        programId,
        deliverables: [],
        ipGoals: [],
      }).then(() => refetch());
    }
  }, [planLoading, plan, autoCreated, month, programId, refetch]);

  // ── Mutations ───────────────────────────────────────────────────

  const acceptBasketItem = useCallback((item: MonthlyBasketItem) => {
    const deliverable: MonthlyPlanDeliverable = {
      id: item.id,
      title: item.title,
      programId: item.programId,
      programName: item.programName,
      source: 'micromap',
      sourceRefId: item.parentCommitmentId ?? item.id,
      estimatedHours: item.estimatedHours,
      deadline: item.deadline ?? null,
      gridCell: null,
      qaCriteria: item.outputSpec ?? null,
      status: 'accepted',
      deferredTo: null,
      isCarryover: false,
      originalDeadline: null,
    };
    setDeliverables(prev => [...prev, deliverable]);
  }, []);

  const acceptCarryover = useCallback((item: MonthlyPlanDeliverable) => {
    setDeliverables(prev => [...prev, { ...item, status: 'accepted' as const }]);
  }, []);

  const deferDeliverable = useCallback((itemId: string) => {
    setDeliverables(prev => prev.map(d =>
      d.id === itemId
        ? { ...d, status: 'deferred' as const, deferredTo: nextMonth(month) }
        : d
    ));
  }, [month]);

  const dropDeliverable = useCallback((itemId: string) => {
    setDeliverables(prev => prev.filter(d => d.id !== itemId));
  }, []);

  const addDeliverable = useCallback((
    item: Omit<MonthlyPlanDeliverable, 'id' | 'status' | 'isCarryover' | 'originalDeadline' | 'deferredTo'>
  ) => {
    const deliverable: MonthlyPlanDeliverable = {
      ...item,
      id: crypto.randomUUID(),
      status: 'accepted',
      isCarryover: false,
      originalDeadline: null,
      deferredTo: null,
    };
    setDeliverables(prev => [...prev, deliverable]);
  }, []);

  const updateEstimate = useCallback((itemId: string, hours: number) => {
    setDeliverables(prev => prev.map(d =>
      d.id === itemId ? { ...d, estimatedHours: hours } : d
    ));
  }, []);

  /**
   * Spec Axis 1: rough week allocation and priority. targetWeek is what the
   * weekly plan's basket reads to know which week a deliverable belongs to.
   */
  const updateDeliverable = useCallback((
    itemId: string,
    updates: Partial<MonthlyPlanDeliverable>
  ) => {
    setDeliverables(prev => prev.map(d => (d.id === itemId ? { ...d, ...updates } : d)));
  }, []);

  /** Spec Axis 3. Passing null clears the commitment rather than storing 0. */
  const setKpiTarget = useCallback((kpiId: string, value: number | null) => {
    setKpiTargets(prev => ({ ...prev, [kpiId]: value }));
  }, []);

  const addIPGoal = useCallback((goal: Omit<MonthlyIPGoal, 'id'>) => {
    setIPGoals(prev => [...prev, { ...goal, id: crypto.randomUUID() }]);
  }, []);

  const removeIPGoal = useCallback((goalId: string) => {
    setIPGoals(prev => prev.filter(g => g.id !== goalId));
  }, []);

  const updateIPGoal = useCallback((goalId: string, updates: Partial<MonthlyIPGoal>) => {
    setIPGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));
  }, []);

  // ── Recurring events (backend mutations) ────────────────────────

  const invalidateRecurring = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['recurring-events', plan?.id] });
  }, [plan?.id]);

  const addRecurringEvent = useCallback(async (event: Omit<RecurringEvent, 'id' | 'isActive'>) => {
    if (!plan?.id) return;
    await MonthlyPlanService.createRecurringEvent(plan.id, event);
    invalidateRecurring();
  }, [plan?.id, invalidateRecurring]);

  const updateRecurringEvent = useCallback(async (eventId: string, updates: Partial<RecurringEvent>) => {
    if (!plan?.id) return;
    await MonthlyPlanService.updateRecurringEvent(plan.id, eventId, updates);
    invalidateRecurring();
  }, [plan?.id, invalidateRecurring]);

  const removeRecurringEvent = useCallback(async (eventId: string) => {
    if (!plan?.id) return;
    await MonthlyPlanService.deleteRecurringEvent(plan.id, eventId);
    invalidateRecurring();
  }, [plan?.id, invalidateRecurring]);

  const weeklyRecurringHours = useMemo(() => {
    return recurringEvents
      .filter(e => e.isActive)
      .reduce((sum, e) => {
        const durationMins = timeToMinutes(e.endTime) - timeToMinutes(e.startTime);
        return sum + (durationMins / 60) * e.daysOfWeek.length;
      }, 0);
  }, [recurringEvents]);

  // ── Draft auto-save (5s debounce + visibilitychange) ───────────
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  const saveDraft = useCallback(async () => {
    if (!plan?.id) return;

    // The KPI payload is built from programKPIs, but the dedupe key is the
    // kpiTargets map. Saving before that query resolves would persist [] and
    // then the unchanged-state guard would block the repair, silently wiping
    // every commitment. Skip the KPI field entirely until the list is loaded.
    const kpisReady = programKPIs.length > 0;
    const kpiPayload = kpisReady
      ? programKPIs.map(k => ({ ...k, myTarget: kpiTargets[String(k.kpiId)] ?? null }))
      : null;

    // The guard key includes kpisReady so the first save after the KPIs arrive
    // is never mistaken for "nothing changed".
    const stateStr = JSON.stringify({ deliverables, ipGoals, kpiTargets, kpisReady });
    if (stateStr === lastSavedRef.current) return;
    lastSavedRef.current = stateStr;

    await MonthlyPlanService.updatePlan(plan.id, {
      deliverables,
      ipGoals,
      ...(kpiPayload ? { kpiTargets: kpiPayload } : {}),
    });
  }, [plan?.id, deliverables, ipGoals, kpiTargets, programKPIs]);

  useEffect(() => {
    if (!plan?.id) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveDraft, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [deliverables, ipGoals, kpiTargets, plan?.id, saveDraft]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') saveDraft();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [saveDraft]);

  // ── Submit ──────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPlan = useCallback(async () => {
    if (!plan?.id) return;
    setIsSubmitting(true);
    try {
      await saveDraft();
      await MonthlyPlanService.submitPlan(plan.id);
      refetch();
    } finally {
      setIsSubmitting(false);
    }
  }, [plan?.id, saveDraft, refetch]);

  return {
    plan,
    isLoading: planLoading,
    error: null,
    basketItems,
    carryovers,
    programKPIs,
    ipItems,
    deliverables,
    ipGoals,
    acceptBasketItem,
    acceptCarryover,
    deferDeliverable,
    dropDeliverable,
    addDeliverable,
    updateEstimate,
    updateDeliverable,
    kpiTargets,
    setKpiTarget,
    feedback: plan?.feedback ?? [],
    context: plan?.context,
    addIPGoal,
    removeIPGoal,
    updateIPGoal,
    recurringEvents,
    weeklyRecurringHours,
    addRecurringEvent,
    updateRecurringEvent,
    removeRecurringEvent,
    submitPlan,
    isSubmitting,
    saveDraft,
  };
}
