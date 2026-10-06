import { useCallback, useEffect, useMemo, useRef } from "react";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { getApiContext } from "@/lib/api/client";
import { ReportV7Service } from "@/lib/services/aavahana/report-v7.service";
import {
  adaptConstraints,
  adaptNavigations,
  adaptFrameworks,
  adaptFeelings,
  adaptDeliverables,
} from "@/lib/adapters/report-v7.adapters";
import type {
  SuggestionExpandPayload,
  OpenSuggestionResponse,
  SuggestionRespondPayload,
  SuggestionHistoryResponse,
} from "@/types/aavahana/learning.types";
import type {
  V7Dictionaries,
  V7SubmitPayload,
  V7RegenerateAiPayload,
  V7HighlightPayload,
  V7DraftPayload,
  V7DraftResponse,
  V7CoachConversation,
  V7CoachSendPayload,
  V7SynthesizePayload,
} from "@/types/aavahana/report-v7.types";
import type { PlannedDeliverable } from "@/types/aavahana/report-engine.types";

/**
 * Fetch deliverables for the given date.
 * staleTime: 0 — fresh per day.
 */
export function useV7Deliverables(date: string) {
  const result = useApi({
    queryKey: ["v7-deliverables", date],
    queryFn: () => ReportV7Service.getDeliverables(date),
    enabled: !!date,
  });

  const data = useMemo(
    () =>
      result.data ? adaptDeliverables(result.data.plannedItems) : undefined,
    [result.data],
  );

  return {
    ...result,
    data,
    sectionAContext: result.data,
  } as {
    data: PlannedDeliverable[] | undefined;
    sectionAContext: typeof result.data;
    isLoading: typeof result.isLoading;
    /**
     * True while a refetch is in flight, including one over cached data.
     *
     * `isLoading` is only true on the very first fetch. After the plan is
     * re-submitted the cache is invalidated, not emptied, so the next reader
     * gets `isLoading: false` and the OLD task list, with the real fetch still
     * running behind it. Anything that seeds state once has to wait on this.
     */
    isFetching: typeof result.isFetching;
    isError: typeof result.isError;
    error: typeof result.error;
    refetch: typeof result.refetch;
  };
}

/**
 * Fetch all dictionaries (constraints, navigations, frameworks, feelings) in parallel.
 * staleTime: 24h — these are slow-changing ontology data.
 */
export function useV7Dictionaries() {
  // Frameworks are scoped per org (curated department assignments), so the
  // cache key must not survive an org switch.
  const orgId = getApiContext("organizationId") ?? "";
  return useApi({
    queryKey: ["v7-dictionaries", orgId],
    queryFn: async (): Promise<V7Dictionaries> => {
      const [constraintsRes, navigationsRes, frameworksRes, feelingsRes] =
        await Promise.all([
          ReportV7Service.getConstraints(),
          ReportV7Service.getNavigations(),
          ReportV7Service.getFrameworks(),
          ReportV7Service.getFeelings(),
        ]);

      // Each result is checked — useApi's wrappedQueryFn will catch thrown errors
      if ("error" in constraintsRes) throw constraintsRes.error;
      if ("error" in navigationsRes) throw navigationsRes.error;
      if ("error" in frameworksRes) throw frameworksRes.error;
      if ("error" in feelingsRes) throw feelingsRes.error;

      return {
        constraints: adaptConstraints(constraintsRes),
        navigations: adaptNavigations(navigationsRes),
        frameworks: adaptFrameworks(frameworksRes),
        feelings: adaptFeelings(feelingsRes),
      };
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h
  });
}

/**
 * Fetch context signals for tree branching.
 * staleTime: 0 — fresh per day.
 */
export function useV7Signals(date: string) {
  return useApi({
    queryKey: ["v7-signals", date],
    queryFn: () => ReportV7Service.getSignals(date),
    enabled: !!date,
  });
}

/**
 * Load a saved draft for the given date.
 * Drafts are optional, so consumers may choose to ignore query errors.
 */
export function useV7Draft(date: string) {
  return useApi({
    queryKey: ["v7-draft", date],
    queryFn: () => ReportV7Service.getDraft(date),
    enabled: !!date,
  }) as {
    data: V7DraftResponse | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  };
}

/**
 * Submit mutation. Invalidates `attendance-summary` on success so the
 * My Attendance calendar picks up the fresh `present` row the backend
 * writes via the real-time resolver in the same submit handler.
 */
export function useV7Submit() {
  return useApiMutation({
    mutationFn: (payload: V7SubmitPayload) =>
      ReportV7Service.submitReport(payload),
    invalidateKeys: [["attendance-summary"]],
  });
}

/**
 * "Try again" — re-runs the AI prompts for an already-submitted report.
 * Capped at MAX_REGENERATIONS retries by the backend.
 */
export function useV7RegenerateAi() {
  return useApiMutation({
    mutationFn: (payload: V7RegenerateAiPayload) =>
      ReportV7Service.regenerateAi(payload),
  });
}

// ── Learning loop ──

/**
 * The one open suggestion. `peek` reads it without counting as shown; pass it
 * anywhere the suggestion is rendered incidentally rather than put in front of
 * the person, so "have they actually seen it" stays a real number.
 */
export function useOpenSuggestion(enabled = true, peek = false) {
  return useApi({
    queryKey: ["v7-suggestion", peek],
    queryFn: () => ReportV7Service.getOpenSuggestion(peek),
    enabled,
    staleTime: 0,
  }) as {
    data: OpenSuggestionResponse | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  };
}

/**
 * Answer the open suggestion. Invalidates both the suggestion and the history,
 * because a closing answer frees the slot and changes the totals on the
 * learning screen at the same time.
 */
export function useRespondToSuggestion() {
  return useApiMutation({
    mutationFn: (payload: SuggestionRespondPayload) =>
      ReportV7Service.respondToSuggestion(payload),
    invalidateKeys: [["v7-suggestion"], ["v7-suggestion-history"]],
  });
}

/** "Go deeper" on the open suggestion. Refreshes it so the text sticks. */
export function useExpandSuggestion() {
  return useApiMutation({
    mutationFn: (payload: SuggestionExpandPayload) =>
      ReportV7Service.expandSuggestion(payload),
    invalidateKeys: [["v7-suggestion"]],
  });
}

/** Everything ever suggested, and what they said about each. */
export function useSuggestionHistory(limit?: number) {
  return useApi({
    queryKey: ["v7-suggestion-history", limit ?? null],
    queryFn: () => ReportV7Service.getSuggestionHistory(limit),
  }) as {
    data: SuggestionHistoryResponse | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  };
}

/**
 * Recognition "tell me more" — saves the optional highlight onto an
 * already-submitted report. Invalidates nothing on the report side (the row is
 * already in the summary the user is looking at) but does clear the supervisor
 * week cache, so a manager with the drawer open picks it up on next open.
 */
export function useV7SaveHighlight() {
  return useApiMutation({
    mutationFn: (payload: V7HighlightPayload) =>
      ReportV7Service.saveHighlight(payload),
    invalidateKeys: [["member-week-dailies"]],
  });
}

/**
 * In-flow Socratic coach — fetch today's chat thread on mount. Disabled
 * unless a date is set.
 */
export function useV7Coach(date: string) {
  return useApi({
    queryKey: ["v7-coach", date],
    queryFn: () => ReportV7Service.getCoachConversation(date),
    enabled: !!date,
    staleTime: 0,
  }) as {
    data: V7CoachConversation | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

/** In-flow Socratic coach — send a turn. */
export function useV7CoachSend() {
  return useApiMutation({
    mutationFn: (payload: V7CoachSendPayload) =>
      ReportV7Service.sendCoachMessage(payload),
  });
}

/**
 * "Help me with my report": one draft per answer. Never retried on its own,
 * because every attempt is a paid call on the person's own key.
 */
export function useV7Synthesize() {
  return useApiMutation({
    mutationFn: (payload: V7SynthesizePayload) =>
      ReportV7Service.synthesize(payload),
    retry: false,
    gcTime: 0,
  });
}

/**
 * Draft auto-save — debounced 5s, also fires on visibilitychange.
 */
export function useV7DraftSave(
  draftState: Record<string, unknown> | null,
  date: string,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const save = useCallback(async () => {
    if (!draftState || !date) return;
    const stateStr = JSON.stringify(draftState);
    if (stateStr === lastSavedRef.current) return; // no change
    lastSavedRef.current = stateStr;
    const payload: V7DraftPayload = { date, engineState: draftState };
    await ReportV7Service.saveDraft(payload);
  }, [draftState, date]);

  // Debounced save on state change
  useEffect(() => {
    if (!draftState || !date) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draftState, date, save]);

  // Save on visibility change (tab switch / close)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        save();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [save]);
}
