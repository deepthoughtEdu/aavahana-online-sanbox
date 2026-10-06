"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { Provider } from "jotai";
import { ConversationRenderer } from "./ConversationRenderer";
import {
  engineAtom,
  buildDraftSnapshot,
  hydrateEngineAtom,
  initEngineAtom,
  type SectionTSVMap,
  type SectionTSVFiles,
} from "@/lib/engine/tree-walker";
import {
  dictionariesAtom,
  signalsAtom,
  feedbackAtom,
  aiFeedbackAtom,
  reportIdAtom,
  submitPendingAtom,
} from "./data/atoms";
import { showInsightToast } from "@/lib/aavahana/insight-toast";
import { GrowthPlant } from "@/components/aavahana/GrowthPlant";
import {
  useV7Deliverables,
  useV7Dictionaries,
  useV7Draft,
  useV7Signals,
  useV7Submit,
  useV7DraftSave,
} from "@/lib/hooks/aavahana/use-report-v7";
import { ReportV7Service } from "@/lib/services/aavahana/report-v7.service";
import { PlanService } from "@/lib/services/aavahana/plan.service";
import { useApi } from "@/lib/hooks/shared/use-api";
import { isError } from "@/lib/api/client";
import type { V7SubmitPayload } from "@/types/aavahana/report-v7.types";
import { TourHelpButton } from "@/components/shared/TourHelpButton";
import { createDailyReportTour } from "@/lib/tours/daily-report.tour";
import type { Tour } from "@/lib/managers/tour";
import { byokConfigAtom, normalizeByokModel } from "@/lib/store/shared/byok.store";
import { SparklesIcon } from "@/components/shared/icons";
import { MessageCircle, ClipboardList } from "lucide-react";
import { AiCoachDrawer } from "./AiCoachDrawer";
import { DayNavigator } from "@/components/shared/DayNavigator";
import { todayISO as getTodayISO, addTime, formatDate } from "@/utils/shared/date.utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Fetch split TSVs from public/trees/ ──
async function fetchSectionFiles(section: string): Promise<SectionTSVFiles> {
  const [flow, copy, options] = await Promise.all([
    fetch(`/trees/section${section}-flow.tsv`).then((r) => r.text()),
    fetch(`/trees/section${section}-copy.tsv`).then((r) => r.text()),
    fetch(`/trees/section${section}-options.tsv`).then((r) => r.text()),
  ]);
  return { flow, copy, options };
}

async function fetchTSVs(): Promise<SectionTSVMap> {
  const [a, b, c] = await Promise.all([
    fetchSectionFiles("A"),
    fetchSectionFiles("B"),
    fetchSectionFiles("C"),
  ]);
  return { A: a, B: b, C: c };
}

// ── Phase labels (narrative arc, not form sections) ──
const PHASE_LABELS: Record<string, string> = {
  A: "Your work",
  B: "What challenged you",
  C: "How you grew",
};

// ── Inner component (needs Jotai Provider above) ──
function DailyReportV7EngineInner() {
  const router = useRouter();
  const [engineState] = useAtom(engineAtom);
  const initEngine = useSetAtom(initEngineAtom);
  const hydrateEngine = useSetAtom(hydrateEngineAtom);
  const setDictionaries = useSetAtom(dictionariesAtom);
  const setSignals = useSetAtom(signalsAtom);
  const setFeedback = useSetAtom(feedbackAtom);
  const setAiFeedback = useSetAtom(aiFeedbackAtom);
  const setReportId = useSetAtom(reportIdAtom);
  const setSubmitPending = useSetAtom(submitPendingAtom);
  const byokConfig = useAtomValue(byokConfigAtom);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  // True when the viewed (past) date has no submitted report — render a
  // read-only empty state rather than the (stale) conversation engine.
  const [reportMissing, setReportMissing] = useState(false);
  const tourRef = useRef<Tour | null>(null);
  // Guards against double-submit when the engine settles into isComplete=true.
  // The submit effect's [isComplete] dependency would re-fire if the boolean
  // ever toggled back-and-forth; this ref makes the submit truly one-shot per
  // page lifetime.
  const submittedRef = useRef(false);

  useEffect(() => {
    tourRef.current = createDailyReportTour();
    tourRef.current.start();
    return () => { tourRef.current?.forceDestroy(); };
  }, []);

  // The viewed date (YYYY-MM-DD). Defaults to today; the day navigator lets the
  // user step back to review past reports. `today` below is the local-time
  // current day used as the navigation ceiling.
  const todayISO = getTodayISO();
  const [currentDate, setCurrentDate] = useState(todayISO);
  const isToday = currentDate === todayISO;

  const goToPrevDay = useCallback(() => {
    setCurrentDate((d) => formatDate(addTime(d, -1, "day"), "YYYY-MM-DD"));
  }, []);
  const goToNextDay = useCallback(() => {
    setCurrentDate((d) => {
      const next = formatDate(addTime(d, 1, "day"), "YYYY-MM-DD");
      return next > todayISO ? d : next;
    });
  }, [todayISO]);
  const jumpToDate = useCallback(
    (iso: string) => {
      if (iso > todayISO) return;
      setCurrentDate(iso);
    },
    [todayISO],
  );

  // Reset the loading gate whenever the date changes so the init effect below
  // re-runs against the newly-fetched data for that day.
  useEffect(() => {
    setLoading(true);
    setError(null);
    setReportMissing(false);
    submittedRef.current = false;
  }, [currentDate]);

  // Gate: a daily report requires a submitted daily plan for that day. We pull
  // the plan first so the screen can short-circuit to an empty state before
  // any of the report-specific machinery runs.
  const { data: todayPlanResult, isLoading: planLoading } = useApi({
    queryKey: ["daily-plan", currentDate],
    queryFn: () => PlanService.getDailyPlan(currentDate),
  });
  const hasDailyPlan =
    Array.isArray(todayPlanResult) && todayPlanResult.length > 0;

  // Fetch backend data
  const {
    data: deliverables,
    isLoading: delLoading,
    error: delError,
  } = useV7Deliverables(currentDate);
  const {
    data: dictionaries,
    isLoading: dictLoading,
    error: dictError,
  } = useV7Dictionaries();
  const {
    data: signals,
    isLoading: sigLoading,
    error: sigError,
  } = useV7Signals(currentDate);
  const { isLoading: draftLoading } = useV7Draft(currentDate);
  const { mutate: submitReport } = useV7Submit();

  const backendError = delError ?? dictError ?? sigError;

  // Auto-save drafts — only for today's in-progress report. Past dates are
  // view-only, so there's nothing to draft-save there.
  useV7DraftSave(
    isToday &&
      !loading &&
      !error &&
      !engineState.isComplete &&
      engineState.currentNodeId
      ? (buildDraftSnapshot(engineState) as unknown as Record<string, unknown>)
      : null,
    currentDate,
  );

  // Store dictionaries and signals in atoms for child components
  useEffect(() => {
    if (dictionaries) setDictionaries(dictionaries);
  }, [dictionaries, setDictionaries]);

  useEffect(() => {
    if (signals) setSignals(signals);
  }, [signals, setSignals]);

  useEffect(() => {
    if (!backendError) return;

    setError(`Failed to load daily report data: ${backendError.message}`);
    setLoading(false);
  }, [backendError]);

  // Load TSVs, check for draft, initialize engine when backend data is ready.
  // Gate on the loading FLAGS (not on the data being truthy): a past date can
  // legitimately have no deliverables/signals, and waiting for those to become
  // truthy would stall `loading` forever → infinite spinner. Only the
  // dictionaries (the conversation tree's ontology) are strictly required.
  useEffect(() => {
    if (!loading) return;
    if (delLoading || dictLoading || sigLoading || draftLoading) return;
    if (!dictionaries) return;

    async function init() {
      try {
        const tsvMap = await fetchTSVs();

        const draftResult = await ReportV7Service.getDraft(currentDate);
        const validResult =
          !isError(draftResult) && draftResult ? draftResult : null;

        if (validResult?.status === "submitted") {
          // Already submitted — hydrate engine to its persisted final state,
          // restore aiFeedback, mark submittedRef so the submit useEffect
          // won't fire a duplicate POST. The completion view renders from this
          // state directly (works for both today and any past date).
          //
          // Force isComplete=true so the completion view always shows for a
          // submitted report, regardless of the cursor saved in engineState.
          if (validResult.engineState) {
            hydrateEngine({
              tsvMap,
              deliverables: (deliverables ?? []).map((d) => ({ ...d })),
              signals: signals ?? null,
              draftState: { ...validResult.engineState, isComplete: true },
            });
          }
          if (validResult.aiFeedback) {
            setAiFeedback(validResult.aiFeedback);
          }
          submittedRef.current = true;
        } else if (
          isToday &&
          validResult?.status === "draft" &&
          validResult.engineState
        ) {
          // Resume an in-progress draft — today only.
          hydrateEngine({
            tsvMap,
            deliverables: (deliverables ?? []).map((d) => ({ ...d })),
            signals: signals ?? null,
            draftState: validResult.engineState,
          });
        } else if (isToday) {
          // Fresh conversation — today only.
          initEngine({
            tsvMap,
            deliverables: (deliverables ?? []).map((d) => ({ ...d })),
            signals: signals ?? null,
          });
        } else {
          // Past date with no submitted report → render a read-only "no
          // report" state rather than the (possibly stale) conversation.
          setReportMissing(true);
        }
        setLoading(false);
      } catch (err) {
        setError(
          `Failed to load: ${err instanceof Error ? err.message : String(err)}`,
        );
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, delLoading, dictLoading, sigLoading, draftLoading, deliverables, dictionaries, signals]);

  // Build the submit payload from the current engine state and POST it.
  // Shared by the one-shot auto-submit (when the conversation completes) and
  // the manual "Edit report" re-submit on the completion view. The backend
  // upserts by (eid, date), so calling this again simply overwrites the row.
  const runSubmit = useCallback(() => {
    const payload: V7SubmitPayload = {
      date: currentDate,
      payload: {
        constraintMacroId: engineState.constraint?.macroId ?? null,
        constraintMicroId: engineState.constraint?.microId ?? null,
        navigationMacroId: engineState.navigation?.macroId ?? null,
        navigationMicroId: engineState.navigation?.microId ?? null,
        frameworkMacroId: engineState.framework?.macroId ?? null,
        frameworkMicroId: engineState.framework?.microId ?? null,
        frameworkQuantity: null,
        feelingMacroId: engineState.feeling?.macroId ?? null,
        feelingMicroId: engineState.feeling?.microId ?? null,
        narrative: engineState.narrative || null,
        constraintDetail: null,
        smoothDayNote: engineState.smoothDayNote || null,
        deliverables: engineState.deliverables,
        unplanned: engineState.unplanned,
        frameworkHelpedConstraint: null,
        frameworkCommitment: engineState.frameworkCommitment
          ? {
              macroId: engineState.frameworkCommitment.macroId,
              macroLabel: engineState.frameworkCommitment.macroLabel,
            }
          : null,
        skippedAct2: engineState.constraint === null,
        history: engineState.history as unknown as Record<string, unknown>[],
        durationSecs: engineState.startedAt
          ? Math.round((Date.now() - engineState.startedAt) / 1000)
          : null,
        // Persist the full engine snapshot so reloads can rehydrate the
        // completion view without re-walking the conversation. Labels for
        // constraint/navigation/framework/feeling are only on the snapshot,
        // not on the flat *MacroId columns, so we'd lose them otherwise.
        engineState: buildDraftSnapshot(engineState) as unknown as Record<
          string,
          unknown
        >,
      },
      // BYOK creds — sent only when configured. Absent → backend skips AI
      // feedback and the report submits normally. Model is normalized at the
      // edge so any stale localStorage like "Gemini 2.5 Flash" still reaches
      // the provider as a valid kebab-case ID.
      ...(byokConfig.apiKey && byokConfig.provider && byokConfig.model
        ? {
            apiKey: byokConfig.apiKey,
            provider: byokConfig.provider,
            model: normalizeByokModel(byokConfig.model),
          }
        : {}),
    };
    setSubmitPending(true);
    submitReport(payload, {
      onSuccess: (result) => {
        if (result && "feedback" in result) {
          setFeedback({
            streak: result.feedback.streak,
            points: result.feedback.points,
            constraintPersistence: {
              type:
                engineState.constraint?.macroLabel ??
                engineState.constraint?.microLabel ??
                "",
              count: result.feedback.constraintPersistence,
              days: 7,
            },
            navigationVariety: { count: result.feedback.navigationVariety },
          });
          setAiFeedback(result.aiFeedback ?? null);
          showInsightToast(result.insight);
          // Report id sources the heroics→constraint filing (W2.3) so a filed
          // Spotted IO carries this report as its source.
          setReportId(result.reportId ?? null);
        }
      },
      onSettled: () => {
        setSubmitPending(false);
      },
    });
  }, [
    currentDate,
    engineState,
    byokConfig,
    submitReport,
    setSubmitPending,
    setFeedback,
    setAiFeedback,
    setReportId,
  ]);

  // Submit when engine completes. We treat TWO signals as "done":
  //   1. engineState.isComplete === true (the normal path), or
  //   2. currentNode is an "end"-type TSV node (defensive — if the auto-advance
  //      chain that flips isComplete fails for any reason, simply landing on an
  //      end node still triggers submit).
  // The ref makes this a true one-shot per mount.
  const currentEndNode =
    engineState.tree?.nodeMap[engineState.currentNodeId ?? ""]?.type === "end";
  const shouldSubmit = engineState.isComplete || currentEndNode;

  useEffect(() => {
    if (!shouldSubmit) return;
    if (submittedRef.current) return;
    submittedRef.current = true;
    console.info("[daily-report] engine complete → submitting", {
      currentNodeId: engineState.currentNodeId,
      isComplete: engineState.isComplete,
      atEndNode: currentEndNode,
      historyEntries: engineState.history.length,
    });
    runSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldSubmit]);

  if (loading || planLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Minimal header with the day navigator — reused by the gate / empty states
  // so the user can step between days from any of them.
  const dayNavHeader = (
    <div className="sticky top-0 z-10 bg-base-100/95 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-sm font-semibold text-base-content">
          {isToday ? "Daily Report" : "Past Report"}
        </h1>
        <div className="flex items-center gap-2">
          <GrowthPlant />
          <DayNavigator
            currentDate={currentDate}
            todayISO={todayISO}
            onPrev={goToPrevDay}
            onNext={goToNextDay}
            onJump={jumpToDate}
            prevId="tour-report-prev-day"
            nextId="tour-report-next-day"
          />
        </div>
      </div>
    </div>
  );

  // Plan gate — for TODAY only. A daily report reflects on the day's plan, so
  // without one there's nothing to report on. Past dates skip this (they're
  // view-only and use the "no report" state below instead).
  if (isToday && !hasDailyPlan) {
    return (
      <div className="flex min-h-screen flex-col bg-base-100">
        {dayNavHeader}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-8 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-base-content">
                Submit today&apos;s plan first
              </h2>
              <p className="text-sm leading-relaxed text-base-content/65">
                Your daily report reflects on the day&apos;s plan. Create a daily
                plan for today, then come back to reflect on how it went.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/aavahana/daily-plan")}
              className="btn btn-primary btn-sm"
            >
              Create today&apos;s plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Past date with no report on record — read-only empty state.
  if (reportMissing) {
    return (
      <div className="flex min-h-screen flex-col bg-base-100">
        {dayNavHeader}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-8 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-base-200 text-base-content/50">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-base-content">
                No report for this day
              </h2>
              <p className="text-sm leading-relaxed text-base-content/65">
                {formatDate(currentDate, "dddd, MMMM DD")} has no submitted daily
                report. Use the arrows above to review another day.
              </p>
            </div>
            <button
              type="button"
              onClick={() => jumpToDate(todayISO)}
              className="btn btn-primary btn-sm"
            >
              Back to today
            </button>
          </div>
        </div>
      </div>
    );
  }

  const debugMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug") === "1";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-base-100">
      {/* Debug overlay — opt in with ?debug=1 in the URL. Pinned to the bottom
          so we can see currentNodeId / isComplete / section without DevTools
          while diagnosing stuck-flow bugs. */}
      {debugMode && (
        <div className="fixed bottom-2 left-2 z-50 max-w-xs rounded-md bg-base-content/90 px-3 py-2 font-mono text-[10px] leading-tight text-base-100 shadow-lg">
          <div>node: {engineState.currentNodeId ?? "(none)"}</div>
          <div>section: {engineState.section ?? "(none)"}</div>
          <div>isComplete: {String(engineState.isComplete)}</div>
          <div>history: {engineState.history.length} entries</div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-base-100/95 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <span
              id="tour-report-phase-badge"
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                engineState.section === "B"
                  ? "bg-warning/15 text-warning"
                  : engineState.section === "C"
                    ? "bg-success/15 text-success"
                    : "bg-primary/15 text-primary"
              }`}
            >
              {PHASE_LABELS[engineState.section] ?? "Daily Reflection"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GrowthPlant />
            <DayNavigator
              currentDate={currentDate}
              todayISO={todayISO}
              onPrev={goToPrevDay}
              onNext={goToNextDay}
              onJump={jumpToDate}
              prevId="tour-report-prev-day"
              nextId="tour-report-next-day"
            />
            <Link
              href="/aavahana/settings/ai-coach"
              className="btn btn-ghost btn-xs gap-1 text-base-content/40"
              title={
                byokConfig.apiKey
                  ? "AI: on — click to manage settings"
                  : "AI off — click to set up"
              }
            >
              <SparklesIcon size="xs" />
              <span>{byokConfig.apiKey ? "AI" : "AI off"}</span>
            </Link>
            {/* Chat launcher — opens the Socratic coach drawer. Hidden on the
                completion view because the AI feedback panel takes over as the
                AI surface there. */}
            {!engineState.isComplete && (
              <button
                type="button"
                onClick={() => {
                  if (!byokConfig.apiKey) {
                    router.push("/aavahana/settings/ai-coach");
                    return;
                  }
                  setCoachOpen(true);
                }}
                className="btn btn-primary btn-sm gap-1.5"
                title={
                  byokConfig.apiKey
                    ? "Open the chat — talk to AI about your daily report"
                    : "Set up your AI key to use the chat"
                }
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Chat</span>
              </button>
            )}
            <span className="text-[11px] font-medium tracking-wide text-base-content/30">
              Daily Reflection
            </span>
          </div>
        </div>

        {/* Section progress — three colour-filled segments with a label under
            each so the user can see where they are in the arc (Your work →
            What challenged you → How you grew) without needing the phase badge
            to be in their line of sight. */}
        <div id="tour-report-progress" className="flex gap-1.5 px-4 pb-3 pt-1.5">
          {(["A", "B", "C"] as const).map((s) => {
            const isCurrent = engineState.section === s;
            const isPast =
              (s === "A" &&
                (engineState.section === "B" || engineState.section === "C")) ||
              (s === "B" && engineState.section === "C");
            return (
              <div key={s} className="flex flex-1 flex-col gap-1">
                <div
                  className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                    isPast
                      ? "bg-success shadow-sm shadow-success/30"
                      : isCurrent
                        ? "bg-primary shadow-sm shadow-primary/30"
                        : "bg-base-200"
                  }`}
                />
                <span
                  className={`text-center text-[10px] font-medium transition-colors duration-300 ${
                    isCurrent
                      ? "text-primary"
                      : isPast
                        ? "text-success/60"
                        : "text-base-content/25"
                  }`}
                >
                  {PHASE_LABELS[s]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversation */}
      <div id="tour-report-conversation" className="pb-24 pt-4">
        {/* Editing is only offered for today's report — past days are read-only. */}
        <ConversationRenderer onResubmit={isToday ? runSubmit : undefined} />
      </div>

      <TourHelpButton
        onClick={() => tourRef.current?.start(true)}
        tooltip="Take a tour of the Daily Report screen"
      />

      {/* Drawer for the in-flow Socratic coach. Opens from the header "Coach"
          button. Hidden on the completion view (the AI feedback panel takes
          over the AI surface), on past days (read-only), and while loading. */}
      {isToday && !loading && !error && !engineState.isComplete && (
        <AiCoachDrawer
          date={currentDate}
          open={coachOpen}
          onClose={() => setCoachOpen(false)}
        />
      )}
    </div>
  );
}

// ── Exported component with Jotai Provider ──
export function DailyReportV7Engine() {
  return (
    <Provider>
      <DailyReportV7EngineInner />
    </Provider>
  );
}
