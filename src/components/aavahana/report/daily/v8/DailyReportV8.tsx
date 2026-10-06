"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ClipboardList,
  PartyPopper,
  Pencil,
} from "lucide-react";

import { CompactChecklist } from "../v7/CompactChecklist";
import { UnplannedItemForm } from "../v5/UnplannedItemForm";
import { DailyReportSummary } from "./DailyReportSummary";
import { ReportExplanationDialog } from "./ReportExplanationDialog";
import { MIN_REPORT_EXPLANATION_CHARS, needsReportExplanation } from "@/utils/aavahana/report-explanation";
import { isServerByokKeyUsableForAavahanaAi } from "@/utils/aavahana/byok-key.utils";
import { RecognitionOverlay } from "./recognition/RecognitionOverlay";
import { SuggestionCheckIn } from "./learning/SuggestionCheckIn";
import type { RecognitionCtx } from "./recognition/variants";
import { GrowthPlant } from "@/components/aavahana/GrowthPlant";
import { DayNavigator } from "@/components/shared/DayNavigator";
import { SparklesIcon } from "@/components/shared/icons";
import { ChipRow, type ChipOption } from "./ChipRow";
import { QuestionReveal } from "./companion/QuestionReveal";
import { SupportChat } from "./companion/SupportChat";
import type { ReportDraft } from "./companion/report-help";
import { CareFollowUp } from "./companion/CareFollowUp";
import { Button } from "@/components/shared/Button";
import { ParticleField } from "./ambient/ParticleField";
import { CinematicIntro } from "./ambient/CinematicIntro";
import { GeneratingInsights } from "../../GeneratingInsights";
import { MicTextarea } from "../../MicTextarea";
import {
  greet,
  afterMood,
  afterWork,
  afterWin,
  afterConstraint,
  afterNav,
  feelingValence,
  type ReactionCtx,
  type Valence,
} from "./companion/reactions";
import { asMacroMicro, type V8Selection, type V8Snapshot } from "./types";

import {
  useV7Deliverables,
  useV7Dictionaries,
  useV7Signals,
  useV7Draft,
  useV7Submit,
  useV7DraftSave,
  useV7RegenerateAi,
  useV7SaveHighlight,
  useOpenSuggestion,
  useRespondToSuggestion,
} from "@/lib/hooks/aavahana/use-report-v7";
import { ReportV7Service } from "@/lib/services/aavahana/report-v7.service";
import { PlanService } from "@/lib/services/aavahana/plan.service";
import { useApi } from "@/lib/hooks/shared/use-api";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { useGrowthStreak } from "@/lib/hooks/aavahana/use-growth-streak";
import { useDayStatus } from "@/lib/hooks/aavahana/use-attendance";
import { useByokKeys } from "@/lib/hooks/admin";
import { isError } from "@/lib/api/client";
import { queryClient } from "@/lib/query/client";
import { showInsightToast } from "@/lib/aavahana/insight-toast";
import {
  byokConfigAtom,
  normalizeByokModel,
} from "@/lib/store/shared/byok.store";
import { sortFrameworksByConstraint } from "@/lib/adapters/report-v7.adapters";
import { reconcilePlanDeliverables } from "@/lib/adapters/aavahana-route.adapters";
import {
  todayISO as getTodayISO,
  addTime,
  formatDate,
} from "@/utils/shared/date.utils";
import { STATUS_CYCLE } from "@/types/aavahana/report-v5.types";
import type {
  PlannedItemStatus,
  UnplannedWorkItem,
} from "@/types/aavahana/report-v5.types";
import type {
  PlannedDeliverable,
  UnplannedDeliverable,
  MacroMicroSelection,
  Dictionary,
  MicroOption,
} from "@/types/aavahana/report-engine.types";
import type {
  AiFeedback,
  V7SubmitPayload,
} from "@/types/aavahana/report-v7.types";
import type { SubmitInsight } from "@/types/aavahana/insight.types";
import type { SuggestionAction } from "@/types/aavahana/learning.types";

// ── Small helpers ──────────────────────────────────────────────────────────────

function feelingEmoji(label: string): string {
  const l = label.toLowerCase();
  if (/(energi|excit|inspir|thrill)/.test(l)) return "⚡";
  if (/(proud|accompl|satisf|fulfill|confiden)/.test(l)) return "😄";
  if (/(happy|great|joy)/.test(l)) return "😁";
  if (/(calm|content|grateful|steady|focus|neutral|okay|fine)/.test(l))
    return "🙂";
  if (/(tired|drain|exhaust|overwhelm)/.test(l)) return "😮‍💨";
  if (/(frustrat|stuck|annoy|anger|angry)/.test(l)) return "😤";
  if (/(anxio|worri|stress|nervous)/.test(l)) return "😟";
  if (/(sad|down|disappoint|discourag|rough|low)/.test(l)) return "😞";
  if (/(curio|learn|grow)/.test(l)) return "🤔";
  return "🙂";
}

function firstName(u: unknown): string {
  const user = u as
    | { fullname?: string; displayname?: string; username?: string }
    | null
    | undefined;
  const full = user?.fullname || user?.displayname || user?.username || "";
  return full.trim().split(/\s+/)[0] ?? "";
}

// The conversation beats, in order. "nav" only participates when a specific
// constraint flavor with a navigation ontology is chosen.
// Support is deliberately not a beat. See SupportChat.
type Beat = "mood" | "work" | "win" | "constraint" | "nav" | "deeper";
const BEAT_ORDER: Beat[] = [
  "mood",
  "work",
  "win",
  "constraint",
  "nav",
  "deeper",
];

/**
 * "What went well today?" (PRD §12). Sits after `work` on purpose: they have
 * just said what they did, so the question has something to attach to, and it
 * lands BEFORE the blocker question so the report does not end on the bad part
 * of the day.
 *
 * Several answers can be true at once, so several can be picked. A day where
 * you finished something AND helped someone is two facts, and making people
 * choose one throws the other away.
 *
 * Never required. "Nothing specific" is a real answer, and skipping is fine too.
 * Ids must match WENT_WELL in pdgms/loops/daily-report-v7.js, which validates
 * them; unknown ids are dropped there rather than rejecting the submit.
 */
const WENT_WELL_NONE = "nothing";

/**
 * Toggle one chip, keeping "Nothing specific" exclusive.
 *
 * Saying nothing stood out and also that you learned something are not both
 * true, so picking one clears the other. Without this the UI would let people
 * build a contradictory answer and the backend would silently drop half of it,
 * which reads as the screen ignoring a tap.
 */
function toggleWentWell(current: string[], id: string): string[] {
  if (current.includes(id)) return current.filter((v) => v !== id);
  if (id === WENT_WELL_NONE) return [WENT_WELL_NONE];
  return [...current.filter((v) => v !== WENT_WELL_NONE), id];
}
const WENT_WELL_CHIPS: ChipOption[] = [
  { id: "solved_hard", label: "Solved something difficult" },
  { id: "learned", label: "Learned something new" },
  { id: "helped", label: "Helped a teammate" },
  { id: "progress", label: "Made real progress" },
  { id: "finished", label: "Finished something important" },
  { id: "nothing", label: "Nothing specific" },
];

const BG_BY_VALENCE: Record<Valence | "none", string> = {
  positive:
    "from-success/10 via-base-100 to-warning/5 dark:from-success/15 dark:via-base-100 dark:to-warning/10",
  neutral: "from-primary/8 via-base-100 to-base-100",
  negative:
    "from-info/10 via-base-100 to-base-100 dark:from-info/15 dark:via-base-100 dark:to-base-100",
  none: "from-primary/8 via-base-100 to-base-100",
};

// ── The screen ─────────────────────────────────────────────────────────────────

type Phase = "form" | "done" | "missing";

export function DailyReportV8() {
  const router = useRouter();
  const byokConfig = useAtomValue(byokConfigAtom);
  const { data: storedByokKeys } = useByokKeys();
  const browserByokConfigured = Boolean(
    byokConfig.apiKey && byokConfig.provider && byokConfig.model,
  );
  const serverByokConfigured = (storedByokKeys ?? []).some(isServerByokKeyUsableForAavahanaAi);
  const aiConfigured = browserByokConfigured || serverByokConfigured;
  const { user, selectedOrg, eid } = useAuth();
  const supportOwner = user && selectedOrg ? `${selectedOrg.orgId}:${user.uid}:${eid ?? ""}` : "";
  const name = firstName(user);
  const { data: streak } = useGrowthStreak();
  const streakBeforeSubmit = useRef({ submittedDays: 0, currentStreak: 0 });
  useEffect(() => {
    if (streak) {
      streakBeforeSubmit.current = {
        submittedDays: streak.submittedDays,
        currentStreak: streak.currentStreak,
      };
    }
  }, [streak]);
  const streakLabel =
    streak?.currentStreak && streak.currentStreak > 1
      ? `${streak.currentStreak}-day streak`
      : null;

  // Viewed date — today by default, arrows step back through past reports.
  const todayISO = getTodayISO();
  const [currentDate, setCurrentDate] = useState(todayISO);
  const isToday = currentDate === todayISO;
  // The edit window: a report is writable on its day and until 12:00 noon the
  // day after, then it locks. The backend enforces the same rule (org
  // timezone) on submit/draft; this local-clock mirror just drives the UI.
  const yesterdayISO = formatDate(addTime(todayISO, -1, "day"), "YYYY-MM-DD");
  const beforeNoon = new Date().getHours() < 12;
  const isEditable = isToday || (currentDate === yesterdayISO && beforeNoon);

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
      if (iso <= todayISO) setCurrentDate(iso);
    },
    [todayISO],
  );

  // ── Backend data (same endpoints as v7) ──
  const { data: todayPlanResult, isLoading: planLoading } = useApi({
    queryKey: ["daily-plan", currentDate],
    queryFn: () => PlanService.getDailyPlan(currentDate),
  });
  const hasDailyPlan =
    Array.isArray(todayPlanResult) && todayPlanResult.length > 0;

  // Yesterday-still-open nudge. On today's report, before noon, if yesterday
  // had a plan but no submitted report, one tappable line offers the jump.
  // Never a gate: today's flow is never blocked on yesterday.
  const checkYesterday = isToday && beforeNoon;
  const { data: yPlanResult } = useApi({
    queryKey: ["daily-plan", yesterdayISO],
    queryFn: () => PlanService.getDailyPlan(yesterdayISO),
    enabled: checkYesterday,
  });
  const { data: yDraft } = useApi({
    queryKey: ["v7-draft", yesterdayISO],
    queryFn: () => ReportV7Service.getDraft(yesterdayISO),
    enabled: checkYesterday,
  });
  const yesterdayStillOpen =
    checkYesterday &&
    Array.isArray(yPlanResult) &&
    yPlanResult.length > 0 &&
    yDraft !== undefined &&
    (yDraft as { status?: string } | null)?.status !== "submitted";

  // Weekend, holiday or leave — no report is owed, so the day is never opened
  // for one. Answered live (not from the attendance row, which the sweep only
  // writes at 21:30), so it is already right while the day is in progress.
  const { data: dayStatus } = useDayStatus(currentDate);
  const dayOff =
    dayStatus && !dayStatus.reportExpected ? dayStatus : null;

  const {
    data: planDeliverables,
    isLoading: delLoading,
    isFetching: delFetching,
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
  const { mutate: regenerateAi, isPending: isRegenerating } =
    useV7RegenerateAi();
  const { mutateAsync: saveHighlight } = useV7SaveHighlight();
  const { mutateAsync: respondToSuggestion } = useRespondToSuggestion();
  // The open suggestion, for the check-in at the top of the report. Only asked
  // about on today's report: reviewing an old day should not interrogate you.
  // Read in peek mode so merely loading the page does not count as "they saw
  // it" — the check-in card records that itself, when it actually renders.
  const { data: suggestionData } = useOpenSuggestion(true, true);
  const [checkInDismissed, setCheckInDismissed] = useState(false);

  // ── Screen state ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [submitted, setSubmitted] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitting = useRef(false);

  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [deliverables, setDeliverables] = useState<PlannedDeliverable[]>([]);
  const [unplanned, setUnplanned] = useState<UnplannedDeliverable[]>([]);
  const [constraint, setConstraint] = useState<V8Selection | null>(null);
  const [navigation, setNavigation] = useState<V8Selection | null>(null);
  const [feeling, setFeeling] = useState<V8Selection | null>(null);
  const [framework, setFramework] = useState<V8Selection | null>(null);
  const [smoothDay, setSmoothDay] = useState(false);
  const [smoothDayNote, setSmoothDayNote] = useState("");
  const [narrative, setNarrative] = useState("");
  const [wentWell, setWentWell] = useState<string[]>([]);
  // Support opens over the report and closes back to exactly where they were.
  // It is deliberately NOT a step: when it was one, a mood of "energized"
  // could be routed into it and the step counter lost track of where they
  // were. Session-only; nothing said in support reaches the report.
  const [supportOpen, setSupportOpen] = useState(false);
  // Mounted on first open and only hidden after that, so a conversation is
  // still there if they come back to it during this visit.
  const [supportMounted, setSupportMounted] = useState(false);
  const supportWrap = useRef<HTMLDivElement>(null);
  const [submitAfterApply, setSubmitAfterApply] = useState(false);

  // ── Conversation state ──
  // companionByBeat[b] = the guide's line shown just before beat b's input.
  const [companionByBeat, setCompanionByBeat] = useState<
    Partial<Record<Beat, string>>
  >({});
  const [activeBeat, setActiveBeat] = useState<Beat>("mood");
  const [furthest, setFurthest] = useState<Beat>("mood");
  // Whether the active question has finished its word-by-word reveal; the
  // answers float in only once it has.
  const [questionRevealed, setQuestionRevealed] = useState(false);
  // "Wrap up now" — the quick exit: reveals a one-line note field so even a
  // fast close still captures something, instead of submitting empty.
  const [quickClose, setQuickClose] = useState(false);
  // The cinematic arrival moment shows once per fresh sit-down; resumed drafts
  // and already-submitted days skip it.
  const [introDismissed, setIntroDismissed] = useState(false);

  const [aiFeedback, setAiFeedback] = useState<AiFeedback | null>(null);
  const [rewards, setRewards] = useState<{ streak: number; points: number }>({
    streak: 0,
    points: 0,
  });
  const [durationSecs, setDurationSecs] = useState<number | null>(null);

  // The recognition overlay plays only on a FRESH submit — re-opening a day you
  // already closed shows the summary alone. Celebrating a page load would be
  // the fastest way to make the celebration meaningless.
  const [celebrating, setCelebrating] = useState(false);
  // The submit insight is a toast. Firing it under a full-screen celebration
  // means two notifications competing for the same moment, so it is held here
  // and released when the overlay clears.
  const pendingInsight = useRef<SubmitInsight | null>(null);
  // The counts the celebration was resolved against, frozen at submit. The
  // streak query is invalidated in the same handler, so reading it live would
  // race the refetch and could swap a milestone out mid-animation.
  const [celebrationCounts, setCelebrationCounts] = useState({
    streak: 0,
    submittedDays: 0,
  });

  // Reset everything when the viewed date changes.
  useEffect(() => {
    setLoading(true);
    setError(null);
    setPhase("form");
    setSubmitted(false);
    setCelebrating(false);
    pendingInsight.current = null;
    setStartedAt(Date.now());
    setDeliverables([]);
    setUnplanned([]);
    setConstraint(null);
    setNavigation(null);
    setFeeling(null);
    setFramework(null);
    setSmoothDay(false);
    setSmoothDayNote("");
    setNarrative("");
    setWentWell([]);
    setSupportOpen(false);
    setCompanionByBeat({});
    setActiveBeat("mood");
    setFurthest("mood");
    setQuestionRevealed(false);
    setQuickClose(false);
    setExplanationOpen(false);
    setSubmitError(null);
    setIntroDismissed(false);
    setAiFeedback(null);
    setRewards({ streak: 0, points: 0 });
    setDurationSecs(null);
  }, [currentDate]);

  // Backend query failures must surface, not spin forever.
  const backendError = delError ?? dictError ?? sigError;
  useEffect(() => {
    if (!backendError) return;
    setError(`Failed to load daily report data: ${backendError.message}`);
    setLoading(false);
  }, [backendError]);

  // ── Derived: recurring-constraint signal, resolved to a human label ──
  const recurring = useMemo(() => {
    const rc = signals?.recurringConstraint;
    if (!rc || !dictionaries) return null;
    let label = rc.micro;
    for (const micros of Object.values(dictionaries.constraints.micro)) {
      const hit = micros.find((m) => m.id === rc.micro);
      if (hit) {
        label = hit.label;
        break;
      }
    }
    return { label, count: rc.count, days: rc.days };
  }, [signals, dictionaries]);

  // Build the reaction context from current state (with optional overrides for
  // values just set in the same handler, before React has re-rendered).
  const buildCtx = useCallback(
    (over?: { mood?: V8Selection | null }): ReactionCtx => {
      const feel = over && "mood" in over ? over.mood : feeling;
      const cp = deliverables.find((d) => d.isCriticalPath) ?? null;
      return {
        name,
        hour: new Date().getHours(),
        mood: feel
          ? { label: feel.macroLabel, valence: feelingValence(feel.macroLabel) }
          : null,
        total: deliverables.length,
        doneCount: deliverables.filter((d) => d.status === "done").length,
        partialCount: deliverables.filter((d) => d.status === "partial").length,
        notDoneCount: deliverables.filter(
          (d) => d.status === "not_done" || d.status === null,
        ).length,
        cpLabel: cp?.label ?? null,
        cpDone: cp?.status === "done",
        constraintLabel: smoothDay
          ? null
          : (constraint?.microLabel ?? constraint?.macroLabel ?? null),
        smoothDay,
        recurring,
        navLabel: navigation?.microLabel ?? navigation?.macroLabel ?? null,
      };
    },
    [name, deliverables, feeling, smoothDay, constraint, navigation, recurring],
  );

  // Restore a snapshot (v8 draft, v7 draft, or a submitted report) into state.
  const hydrateFromSnapshot = useCallback((
    snap: Record<string, unknown>,
    latestPlan?: PlannedDeliverable[],
  ) => {
    const asSel = (v: unknown): V8Selection | null => {
      const s = v as MacroMicroSelection | null | undefined;
      if (!s || typeof s.macroId !== "string") return null;
      return {
        macroId: s.macroId,
        macroLabel: s.macroLabel ?? s.macroId,
        microId: s.microId ?? null,
        microLabel: s.microLabel ?? null,
      };
    };
    const dels = Array.isArray(snap.deliverables)
      ? (snap.deliverables as PlannedDeliverable[])
      : [];
    const reconciled = latestPlan
      ? reconcilePlanDeliverables(latestPlan, dels)
      : dels;
    if (latestPlan || reconciled.length > 0) setDeliverables(reconciled);
    if (Array.isArray(snap.unplanned)) {
      setUnplanned(snap.unplanned as UnplannedDeliverable[]);
    }
    setConstraint(asSel(snap.constraint));
    setNavigation(asSel(snap.navigation));
    setFeeling(asSel(snap.feeling));
    setFramework(asSel(snap.framework));
    setNarrative(typeof snap.narrative === "string" ? snap.narrative : "");
    setSmoothDayNote(
      typeof snap.smoothDayNote === "string" ? snap.smoothDayNote : "",
    );
    setSmoothDay(
      snap.flavor === "v8"
        ? Boolean(snap.smoothDay)
        : Boolean(snap.smoothDayNote),
    );
    // Drafts saved before this question existed carry nothing here, which reads
    // the same as skipping it: an empty selection.
    setWentWell(
      Array.isArray(snap.wentWell) ? (snap.wentWell as string[]) : [],
    );
    // Deliberately NOT restoring snap.startedAt: duration should measure this
    // sit-down, not wall-clock time since the draft was first opened (a resumed
    // morning draft submitted after lunch would report hours).
  }, []);

  // Init per date, once the backend data settles.
  useEffect(() => {
    if (!loading) return;
    if (planLoading || delLoading || dictLoading || sigLoading || draftLoading)
      return;
    // Wait for a refetch in flight, not just a first load.
    //
    // Submitting the plan a second time INVALIDATES the deliverables cache, it
    // does not empty it. So this screen mounts, gets `isLoading: false` and the
    // previous task list, seeds from it, sets loading false, and never runs
    // again — the task you just added is dropped. Logging out appeared to fix
    // it only because that clears the cache outright.
    if (delFetching) return;
    if (!dictionaries) return;

    let cancelled = false;
    async function init() {
      try {
        const draftResult = await ReportV7Service.getDraft(currentDate);
        const row = !isError(draftResult) && draftResult ? draftResult : null;
        if (cancelled) return;

        if (row?.status === "submitted") {
          if (row.engineState) hydrateFromSnapshot(row.engineState);
          if (row.aiFeedback) setAiFeedback(row.aiFeedback);
          setSubmitted(true);
          setPhase("done");
          setIntroDismissed(true);
          setLoading(false);
          return;
        }

        // Fresh or resumable — within the edit window (today or yesterday),
        // seed the day's deliverables and start/resume the conversation.
        // Beyond the window the day is read-only history.
        const seeded = (planDeliverables ?? []).map((d) => ({ ...d }));
        if (isEditable && row?.status === "draft" && row.engineState) {
          const draftDeliverables = Array.isArray(row.engineState.deliverables)
            ? row.engineState.deliverables as PlannedDeliverable[]
            : [];
          const reconciledSnapshot = {
            ...row.engineState,
            deliverables: reconcilePlanDeliverables(seeded, draftDeliverables),
          };
          hydrateFromSnapshot(reconciledSnapshot, seeded);
          resumeConversation(reconciledSnapshot);
        } else if (isEditable) {
          setDeliverables(seeded);
          startConversation();
        } else {
          setPhase("missing");
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          `Failed to load: ${err instanceof Error ? err.message : String(err)}`,
        );
        setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- planDeliverables/dictionaries proxied by loading flags
  }, [
    loading,
    currentDate,
    planLoading,
    delLoading,
    delFetching,
    dictLoading,
    sigLoading,
    draftLoading,
  ]);

  // Kick off a fresh conversation: the guide greets, mood cards follow.
  const startConversation = useCallback(() => {
    const line = greet(buildCtx());
    setCompanionByBeat({ mood: line });
    setActiveBeat("mood");
    setFurthest("mood");
    setQuestionRevealed(false);
    setIntroDismissed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // Resume: reconstruct the transcript lines without animation, land the user
  // on the first unanswered beat.
  const resumeConversation = useCallback(
    (snap: Record<string, unknown>) => {
      const feel = snap.feeling ? (snap.feeling as MacroMicroSelection) : null;
      const cons = snap.constraint
        ? (snap.constraint as MacroMicroSelection)
        : null;
      const nav = snap.navigation
        ? (snap.navigation as MacroMicroSelection)
        : null;
      const smooth =
        snap.flavor === "v8"
          ? Boolean(snap.smoothDay)
          : Boolean(snap.smoothDayNote);
      const dels = Array.isArray(snap.deliverables)
        ? (snap.deliverables as PlannedDeliverable[])
        : [];
      const ctx = buildCtx();

      const lines: Partial<Record<Beat, string>> = { mood: greet(ctx) };
      let land: Beat = "mood";

      const workDone = dels.length > 0 && dels.every((d) => d.status !== null);
      if (feel) {
        const moodCtx: ReactionCtx = {
          ...ctx,
          mood: {
            label: feel.macroLabel,
            valence: feelingValence(feel.macroLabel),
          },
        };
        // Support appears only when the person asks for it, never inferred
        // from the mood they picked. A request is not saved with the draft, so
        // a resumed report always carries on to the work step.
        lines.work = afterMood(moodCtx);
        land = "work";
      }
      const navAvail =
        !smooth && cons?.microId != null && dictionaries != null
          ? dictionaries.navigations[cons.microId] != null
          : false;
      if (feel && workDone) {
        lines.win = afterWork(ctx);
        land = "win";
      }
      // "What went well" is optional, so an empty answer cannot tell "skipped
      // it" from "never got there". The blocker question decides instead: if
      // that is answered they were clearly past this one, and if it is not,
      // resuming on it is right whether they skipped it or never saw it.
      const win = Array.isArray(snap.wentWell)
        ? (snap.wentWell as string[])
        : [];
      const constraintDone = smooth || cons !== null;
      if (feel && workDone && constraintDone) {
        lines.constraint = afterWin(ctx, win);
        if (navAvail) {
          lines.nav = afterConstraint(ctx, true);
          land = "nav";
        } else {
          lines.deeper = afterConstraint(ctx, false);
          land = "deeper";
        }
      }
      if (feel && workDone && constraintDone && navAvail && nav) {
        lines.deeper = afterNav(ctx);
        land = "deeper";
      }

      setCompanionByBeat(lines);
      setActiveBeat(land);
      setFurthest(land);
      setIntroDismissed(true);
    },
    [buildCtx, dictionaries],
  );

  // ── Draft autosave (within the edit window, pre-submit only) ──
  const draftSnapshot = useMemo<Record<string, unknown> | null>(() => {
    if (loading || submitted || phase !== "form" || !isEditable) return null;
    const snap: V8Snapshot = {
      flavor: "v8",
      startedAt,
      deliverables,
      unplanned,
      constraint: asMacroMicro(constraint),
      navigation: asMacroMicro(navigation),
      framework: asMacroMicro(framework),
      feeling: asMacroMicro(feeling),
      narrative,
      smoothDayNote,
      smoothDay,
      wentWell,
      isComplete: false,
    };
    return snap as unknown as Record<string, unknown>;
  }, [
    loading,
    submitted,
    phase,
    isEditable,
    startedAt,
    deliverables,
    unplanned,
    constraint,
    navigation,
    framework,
    feeling,
    narrative,
    smoothDayNote,
    smoothDay,
    wentWell,
  ]);
  useV7DraftSave(draftSnapshot, currentDate);

  // ── Checklist handlers ──
  const cycleStatus = useCallback((taskId: string) => {
    setDeliverables((prev) =>
      prev.map((d) => {
        if (String(d.id) !== taskId) return d;
        const idx = STATUS_CYCLE.indexOf(d.status as PlannedItemStatus);
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        return { ...d, status: next as PlannedDeliverable["status"] };
      }),
    );
  }, []);
  const adjustTime = useCallback((taskId: string, deltaMins: number) => {
    setDeliverables((prev) =>
      prev.map((d) =>
        String(d.id) === taskId
          ? { ...d, actualMins: Math.max(0, d.actualMins + deltaMins) }
          : d,
      ),
    );
  }, []);
  const toggleCriticalPath = useCallback((taskId: string) => {
    setDeliverables((prev) =>
      prev.map((d) => ({
        ...d,
        isCriticalPath: String(d.id) === taskId ? !d.isCriticalPath : false,
      })),
    );
  }, []);
  const addUnplanned = useCallback((item: UnplannedWorkItem) => {
    setUnplanned((prev) => [
      ...prev,
      {
        id: Date.now(),
        gridSlot: "",
        label: item.description,
        minutesTaken: item.minutesTaken,
      },
    ]);
  }, []);
  const removeUnplanned = useCallback((id: number) => {
    setUnplanned((prev) => prev.filter((u) => u.id !== id));
  }, []);

  // ── Chip data ──
  const constraintMacros: ChipOption[] =
    dictionaries?.constraints.macro.map((m) => ({
      id: m.id,
      label: m.label,
    })) ?? [];
  const constraintMicros: MicroOption[] = constraint
    ? (dictionaries?.constraints.micro[constraint.macroId] ?? [])
    : [];

  const navDict: Dictionary | null =
    constraint?.microId && dictionaries
      ? (dictionaries.navigations[constraint.microId] ?? null)
      : null;
  const navMacros: ChipOption[] =
    navDict?.macro.map((m) => ({ id: m.id, label: m.label })) ?? [];
  const navMicros: MicroOption[] =
    navigation && navDict ? (navDict.micro[navigation.macroId] ?? []) : [];

  const feelingMacros = dictionaries?.feelings.macro ?? [];

  const sortedFrameworks: Dictionary | null = dictionaries
    ? sortFrameworksByConstraint(
        dictionaries.frameworks,
        constraint?.macroId ?? null,
      )
    : null;
  const frameworkMacros: ChipOption[] =
    sortedFrameworks?.macro.map((m) => ({
      id: m.id,
      label: m.label,
      prefix: m.pairedWith ? "★" : undefined,
    })) ?? [];
  const frameworkMicros: MicroOption[] =
    framework && sortedFrameworks
      ? (sortedFrameworks.micro[framework.macroId] ?? [])
      : [];

  // ── Flow plumbing ──
  const navAvailable = !smoothDay && constraint !== null && navDict !== null;
  const activeOrder = useMemo<Beat[]>(
    () =>
      BEAT_ORDER.filter((b) => b !== "nav" || navAvailable),
    [navAvailable],
  );
  const idxOf = (b: Beat) => {
    const i = activeOrder.indexOf(b);
    return i === -1 ? activeOrder.length - 1 : i;
  };
  const activeIdx = idxOf(activeBeat);

  const statusesDone =
    deliverables.length > 0 && deliverables.every((d) => d.status !== null);

  const goBack = useCallback(() => {
    const i = activeOrder.indexOf(activeBeat);
    if (i > 0) {
      setActiveBeat(activeOrder[i - 1]);
    } else {
      // Already at the first question — step back to the welcome screen.
      setQuestionRevealed(false);
      setIntroDismissed(false);
    }
  }, [activeOrder, activeBeat]);

  // Re-hide the answers (and any open quick-close field) whenever the active
  // question changes, so every new question runs its reveal cleanly first.
  useEffect(() => {
    setQuestionRevealed(false);
    setQuickClose(false);
  }, [activeBeat]);

  // Advance from `beat` to the next one, computing the guide's reaction line.
  const advanceFrom = useCallback(
    (
      beat: Beat,
      // The value that was just picked. State has not committed yet when this
      // runs, so the companion would otherwise react to the previous answer.
      ctxOver?: { mood?: V8Selection | null },
    ) => {
      const ctx = buildCtx(ctxOver);
      const order = BEAT_ORDER.filter(
        (b) =>
          b !== "nav" ||
          (!ctx.smoothDay && constraint !== null && navDict !== null),
      );
      const i = order.indexOf(beat);
      const next = order[i + 1];
      if (!next) return;

      let line = "";
      if (next === "work") line = afterMood(ctx);
      else if (next === "win") line = afterWork(ctx);
      else if (next === "constraint") line = afterWin(ctx, wentWell);
      else if (next === "nav") line = afterConstraint(ctx, true);
      else if (next === "deeper")
        line = beat === "nav" ? afterNav(ctx) : afterConstraint(ctx, false);

      setCompanionByBeat((prev) => ({ ...prev, [next]: line }));
      setActiveBeat(next);
      setFurthest((prev) =>
        order.indexOf(next) > order.indexOf(prev) ? next : prev,
      );
    },
    [buildCtx, constraint, navDict, wentWell],
  );

  // ── Selection handlers ──
  const pickMood = useCallback(
    (macroId: string, macroLabel: string) => {
      const sel: V8Selection = {
        macroId,
        macroLabel,
        microId: null,
        microLabel: null,
      };
      setFeeling(sel);
      if (activeBeat === "mood" && furthest === "mood") {
        // First answer — the instant hook: advance immediately.
        advanceFrom("mood", { mood: sel });
      }
    },
    [activeBeat, furthest, advanceFrom],
  );

  const pickConstraintMacro = useCallback((o: ChipOption | null) => {
    setSmoothDay(false);
    setNavigation(null);
    setConstraint(
      o
        ? {
            macroId: o.id,
            macroLabel: o.label,
            microId: null,
            microLabel: null,
          }
        : null,
    );
  }, []);
  const pickConstraintMicro = useCallback((o: MicroOption | null) => {
    setNavigation(null);
    setConstraint((prev) =>
      prev
        ? { ...prev, microId: o?.id ?? null, microLabel: o?.label ?? null }
        : prev,
    );
  }, []);
  const pickSmoothDay = useCallback(() => {
    setSmoothDay((prev) => {
      const next = !prev;
      if (next) {
        setConstraint(null);
        setNavigation(null);
      }
      return next;
    });
  }, []);

  const pickNavMacro = useCallback((o: ChipOption | null) => {
    setNavigation(
      o
        ? {
            macroId: o.id,
            macroLabel: o.label,
            microId: null,
            microLabel: null,
          }
        : null,
    );
  }, []);
  const pickNavMicro = useCallback((o: MicroOption | null) => {
    setNavigation((prev) =>
      prev
        ? { ...prev, microId: o?.id ?? null, microLabel: o?.label ?? null }
        : prev,
    );
  }, []);

  const pickFrameworkMacro = useCallback((o: ChipOption | null) => {
    setFramework(
      o
        ? {
            macroId: o.id,
            macroLabel: o.label,
            microId: null,
            microLabel: null,
          }
        : null,
    );
  }, []);
  const pickFrameworkMicro = useCallback((o: MicroOption | null) => {
    setFramework((prev) =>
      prev
        ? { ...prev, microId: o?.id ?? null, microLabel: o?.label ?? null }
        : prev,
    );
  }, []);

  // ── Submit ──
  const runSubmit = useCallback(() => {
    if (submitting.current) return;
    if (needsReportExplanation({
      constraintMacroId: constraint?.macroId,
      frameworkMacroId: framework?.macroId,
      frameworkMicroId: framework?.microId,
      narrative,
      smoothDayNote,
    })) {
      setExplanationOpen(true);
      return;
    }
    submitting.current = true;
    setSubmitError(null);
    const secs = Math.round((Date.now() - startedAt) / 1000);
    const snapshot: V8Snapshot = {
      flavor: "v8",
      startedAt,
      deliverables,
      unplanned,
      constraint: asMacroMicro(constraint),
      navigation: asMacroMicro(navigation),
      framework: asMacroMicro(framework),
      feeling: asMacroMicro(feeling),
      narrative,
      smoothDayNote,
      smoothDay,
      wentWell,
      isComplete: true,
    };
    const history = [
      ...(feeling
        ? [
            {
              nodeId: "V8_FEELING",
              question: "How did today feel?",
              answer: feeling.microLabel ?? feeling.macroLabel,
            },
          ]
        : []),
      {
        nodeId: "V8_WORK",
        question: "Your work",
        answer: `${deliverables.filter((d) => d.status === "done").length}/${deliverables.length} done, ${unplanned.length} unplanned`,
      },
      ...(smoothDay
        ? [
            {
              nodeId: "V8_SMOOTH",
              question: "What slowed you down?",
              answer: "Nothing, smooth day",
            },
          ]
        : []),
      ...(constraint
        ? [
            {
              nodeId: "V8_CONSTRAINT",
              question: "What slowed you down?",
              answer: constraint.microLabel ?? constraint.macroLabel,
            },
          ]
        : []),
      ...(navigation
        ? [
            {
              nodeId: "V8_NAV",
              question: "How did you get past it?",
              answer: navigation.microLabel ?? navigation.macroLabel,
            },
          ]
        : []),
      ...(framework
        ? [
            {
              nodeId: "V8_FRAMEWORK",
              question: "Framework used",
              answer: framework.microLabel ?? framework.macroLabel,
            },
          ]
        : []),
    ];

    const payload: V7SubmitPayload = {
      date: currentDate,
      payload: {
        constraintMacroId: constraint?.macroId ?? null,
        constraintMicroId: constraint?.microId ?? null,
        navigationMacroId: navigation?.macroId ?? null,
        navigationMicroId: navigation?.microId ?? null,
        frameworkMacroId: framework?.macroId ?? null,
        frameworkMicroId: framework?.microId ?? null,
        frameworkQuantity: null,
        feelingMacroId: feeling?.macroId ?? null,
        feelingMicroId: feeling?.microId ?? null,
        narrative: narrative || null,
        constraintDetail: null,
        smoothDayNote: smoothDayNote || null,
        wentWell,
        deliverables,
        unplanned,
        frameworkHelpedConstraint: null,
        frameworkCommitment: null,
        skippedAct2: constraint === null,
        history,
        durationSecs: secs,
        engineState: snapshot as unknown as Record<string, unknown>,
      },
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
        setExplanationOpen(false);
        setSubmitted(true);
        setDurationSecs(secs);
        if (result && "feedback" in result) {
          setRewards({
            streak: result.feedback.streak,
            points: result.feedback.points,
          });
          setAiFeedback(result.aiFeedback ?? null);
          // Held, not shown — released when the recognition overlay clears.
          pendingInsight.current = result.insight ?? null;
          // Re-submitting an edit doesn't add a report, so it must not
          // advance the lifetime count and fake a milestone.
          setCelebrationCounts({
            streak: result.feedback.streak,
            submittedDays:
              streakBeforeSubmit.current.submittedDays + (submitted ? 0 : 1),
          });
        }
        setCelebrating(true);
        queryClient.invalidateQueries({ queryKey: ["v7-growth-streak"] });
        // Submitting may have issued a new suggestion (only when nothing was
        // open), so the summary below needs the fresh one.
        queryClient.invalidateQueries({ queryKey: ["v7-suggestion"] });
        queryClient.invalidateQueries({ queryKey: ["v7-draft", currentDate] });
        // Straight into the report — no interstitial modal, one less click.
        setPhase("done");
      },
      onError: (err) => {
        setSubmitError(`Failed to submit: ${err.message}`);
      },
      onSettled: () => {
        submitting.current = false;
        setSubmitPending(false);
      },
    });
  }, [
    startedAt,
    deliverables,
    unplanned,
    constraint,
    navigation,
    framework,
    feeling,
    narrative,
    smoothDayNote,
    smoothDay,
    wentWell,
    currentDate,
    byokConfig,
    submitReport,
    submitted,
  ]);

  // ── "Help me with my report" ──
  // The report as it stands, for the helper to start from.
  const reportDraft = useMemo<ReportDraft>(
    () => ({
      deliverables,
      feeling,
      constraint,
      navigation,
      framework,
      smoothDay,
      smoothDayNote,
      narrative,
      wentWell,
    }),
    [
      deliverables,
      feeling,
      constraint,
      navigation,
      framework,
      smoothDay,
      smoothDayNote,
      narrative,
      wentWell,
    ],
  );
  const applyDraft = useCallback((draft: ReportDraft) => {
    setDeliverables(draft.deliverables);
    setFeeling(draft.feeling);
    setConstraint(draft.constraint);
    setNavigation(draft.navigation);
    setSmoothDay(draft.smoothDay);
    setSmoothDayNote(draft.smoothDayNote);
    setNarrative(draft.narrative);
    setWentWell(draft.wentWell);
  }, []);
  // Submitting from the helper waits one render, so runSubmit reads the draft
  // that was just applied rather than the report as it was before.
  useEffect(() => {
    if (!submitAfterApply) return;
    setSubmitAfterApply(false);
    runSubmit();
  }, [submitAfterApply, runSubmit]);

  const openSupport = useCallback(() => {
    setSupportMounted(true);
    setSupportOpen(true);
  }, []);
  // A reopened chat does not get the autofocus a fresh one does, so put the
  // cursor back in its box.
  useEffect(() => {
    if (!supportOpen) return;
    const frame = requestAnimationFrame(() => {
      supportWrap.current
        ?.querySelector<HTMLTextAreaElement>("textarea:not([disabled])")
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [supportOpen]);

  // ── Recognition ──
  // The overlay reads the same day-context the in-flow companion does, plus the
  // two counts frozen at submit. Rebuilding it here rather than threading it
  // through means the celebration can never describe a day different from the
  // one the summary underneath is showing.
  const recognitionCtx = useMemo<RecognitionCtx>(() => {
    const base = buildCtx();
    return {
      name,
      eid: String(user?.uid ?? "anon"),
      dateISO: currentDate,
      total: base.total,
      doneCount: base.doneCount,
      partialCount: base.partialCount,
      notDoneCount: base.notDoneCount,
      cpLabel: base.cpLabel,
      cpDone: base.cpDone,
      constraintLabel: base.constraintLabel,
      unplannedCount: unplanned.length,
      moodLabel: base.mood?.label ?? null,
      moodValence: base.mood?.valence ?? "none",
      streak: celebrationCounts.streak || streakBeforeSubmit.current.currentStreak,
      submittedDays: celebrationCounts.submittedDays,
      smoothDay,
    };
  }, [
    buildCtx,
    name,
    user?.uid,
    currentDate,
    unplanned.length,
    celebrationCounts,
    smoothDay,
  ]);

  // Dismissing the celebration is also what releases the held submit insight,
  // so the toast lands on the summary instead of fighting the animation.
  const handleCelebrationDone = useCallback(() => {
    setCelebrating(false);
    const insight = pendingInsight.current;
    pendingInsight.current = null;
    if (insight) window.setTimeout(() => showInsightToast(insight), 220);
  }, []);

  // ── Learning loop check-in ──
  // Shown only when there is an open suggestion issued on an EARLIER day. Asking
  // "did you apply it?" about something issued minutes ago on the same evening
  // would be nonsense, and it is the fastest way to make the question feel
  // automated rather than interested.
  const openSuggestion = suggestionData?.open ?? null;
  const showCheckIn =
    !checkInDismissed &&
    isToday &&
    !!openSuggestion &&
    !!openSuggestion.issuedForDate &&
    openSuggestion.issuedForDate < currentDate;

  const handleSuggestionRespond = useCallback(
    async (action: SuggestionAction, opts: { note?: string; reason?: string }) => {
      if (!openSuggestion) return false;
      try {
        const res = await respondToSuggestion({
          suggestionId: openSuggestion.id,
          action,
          note: opts.note,
          reason: opts.reason,
          date: currentDate,
        });
        return !isError(res);
      } catch {
        return false;
      }
    },
    [respondToSuggestion, openSuggestion, currentDate],
  );

  const handleSaveHighlight = useCallback(
    async (text: string, promptId: string, question: string) => {
      try {
        const res = await saveHighlight({
          date: currentDate,
          highlight: text,
          // Store the question, not the variant id: an id means nothing to a
          // supervisor reading this three weeks later.
          prompt: `${promptId}: ${question}`,
        });
        return !isError(res);
      } catch {
        return false;
      }
    },
    [saveHighlight, currentDate],
  );

  const handleRegenerate = useCallback(() => {
    if (!aiConfigured) return;
    regenerateAi(
      {
        date: currentDate,
        ...(browserByokConfigured
          ? {
              apiKey: byokConfig.apiKey,
              provider: byokConfig.provider,
              model: normalizeByokModel(byokConfig.model),
            }
          : {}),
      },
      {
        onSuccess: (result) => {
          if (result && !isError(result)) setAiFeedback(result as AiFeedback);
        },
      },
    );
  }, [aiConfigured, browserByokConfigured, byokConfig, currentDate, regenerateAi]);

  // ── Derived display bits ──
  const canSubmit = statusesDone && !submitPending;

  // A day we know the tasks of and nothing else. No blocker named, no note on
  // the smooth day, nothing written. The learning loop has only task labels to
  // work from on a report like this, which is how people end up with a generic
  // suggestion and conclude the feature does not know them.
  //
  // A framework on its own does not count as an explanation: it says which tool
  // they reached for, not how the day went.
  const unexplainedDay =
    !constraint && !smoothDayNote.trim() && !narrative.trim();
  const moodValence: Valence | "none" = feeling
    ? feelingValence(feeling.macroLabel)
    : "none";

  const cardState = {
    deliverables,
    unplanned,
    constraint: asMacroMicro(constraint),
    navigation: asMacroMicro(navigation),
    feeling: asMacroMicro(feeling),
    framework: asMacroMicro(framework),
  };

  const beatAnswered: Record<Beat, boolean> = {
    mood: feeling !== null,
    work: statusesDone,
    // Always true: the question is optional, so Continue must never be blocked
    // by it. Every other beat gates on having an answer.
    win: true,
    constraint: smoothDay || constraint !== null,
    nav: navigation !== null,
    deeper: framework !== null || narrative.trim().length > 0,
  };

  // ── Chrome ──
  const header = (
    <div className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <h1 className="text-sm font-semibold text-base-content">
          {isEditable ? "Close your day" : "Past report"}
        </h1>
        <div className="flex items-center gap-2">
          <GrowthPlant />
          <DayNavigator
            currentDate={currentDate}
            todayISO={todayISO}
            onPrev={goToPrevDay}
            onNext={goToNextDay}
            onJump={jumpToDate}
          />
          <Link
            href="/aavahana/settings/ai-coach"
            className="btn btn-ghost btn-xs gap-1 text-base-content/40"
            title={aiConfigured ? "AI: on" : "AI off, tap to set up"}
          >
            <SparklesIcon size="xs" />
            <span>{aiConfigured ? "AI" : "AI off"}</span>
          </Link>
        </div>
      </div>
    </div>
  );

  // ── Loading / error / gates ──
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
  // A day off outranks every other gate: nothing was owed, so don't ask for a
  // plan, don't ask for a report, and don't let it read as a day the person
  // missed. Leave and holidays are not counted against anyone.
  if (dayOff) {
    const onLeave = dayOff.status === "on_leave";
    return (
      <div className="flex min-h-screen flex-col bg-base-100">
        {header}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-8 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info/10 text-info">
              <PartyPopper className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-base-content">
                {onLeave ? "You're on leave" : "It's a day off"}
              </h2>
              <p className="text-sm leading-relaxed text-base-content/65">
                {isToday ? "Today is" : "This day was"} {dayOff.label}, so
                there&apos;s no report to close. It won&apos;t count against your
                attendance.
              </p>
            </div>
            {!isToday && (
              <button
                type="button"
                onClick={() => jumpToDate(todayISO)}
                className="btn btn-primary btn-sm"
              >
                Back to today
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (isEditable && !hasDailyPlan) {
    // Today: point at creating the plan. Yesterday (inside the edit buffer but
    // plans can't be back-dated): explain there's nothing to report on.
    return (
      <div className="flex min-h-screen flex-col bg-base-100">
        {header}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-8 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-base-content">
                {isToday
                  ? "Submit today's plan first"
                  : "No plan was made for this day"}
              </h2>
              <p className="text-sm leading-relaxed text-base-content/65">
                {isToday
                  ? "Your daily report reflects on the day's plan. Create a daily plan for today, then come back to close your day."
                  : "A report reflects on the day's plan, and this day never had one, so there's nothing to report on."}
              </p>
            </div>
            {isToday ? (
              <button
                type="button"
                onClick={() => router.push("/aavahana/daily-plan")}
                className="btn btn-primary btn-sm"
              >
                Create today&apos;s plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => jumpToDate(todayISO)}
                className="btn btn-primary btn-sm"
              >
                Back to today
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (phase === "missing") {
    return (
      <div className="flex min-h-screen flex-col bg-base-100">
        {header}
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
                {formatDate(currentDate, "dddd, MMMM DD")} has no submitted
                daily report. Use the arrows above to review another day.
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

  // ── Done view ──
  if (phase === "done") {
    const doneStreak = rewards.streak || streak?.currentStreak || 0;
    return (
      <div className="fixed inset-x-0 bottom-0 top-14 z-20 overflow-hidden bg-base-200 lg:left-76">
        <div className="pointer-events-none absolute inset-0 opacity-30 blur-2xl">
          <ParticleField density={14} />
        </div>

        {/* The recognition screen. It plays OVER the finished summary rather
            than in front of it: the report is readable the whole time and one
            tap anywhere gets you there, so the celebration never costs a click.
            Only on a fresh submit — never on revisiting a closed day. */}
        {celebrating && (
          <RecognitionOverlay
            ctx={recognitionCtx}
            onDismiss={handleCelebrationDone}
            onSaveHighlight={handleSaveHighlight}
          />
        )}

        <div className="relative h-full overflow-y-auto">
          <div className="flex w-full flex-col gap-5 px-4 pb-10 pt-3 lg:px-8">
            {/* Controls — day nav to review other days. */}
            <div className="flex items-center justify-end gap-2">
              <GrowthPlant />
              <DayNavigator
                currentDate={currentDate}
                todayISO={todayISO}
                onPrev={goToPrevDay}
                onNext={goToNextDay}
                onJump={jumpToDate}
              />
              <Link
                href="/aavahana/settings/ai-coach"
                className="btn btn-ghost btn-xs gap-1 text-base-content/40"
                title={aiConfigured ? "AI: on" : "AI off, tap to set up"}
              >
                <SparklesIcon size="xs" />
                <span>{aiConfigured ? "AI" : "AI off"}</span>
              </Link>
            </div>

            <DailyReportSummary
              dateLabel={formatDate(currentDate, "dddd, MMMM DD")}
              streakDays={doneStreak}
              durationSecs={durationSecs}
              deliverables={deliverables}
              unplanned={unplanned}
              constraint={cardState.constraint}
              navigation={cardState.navigation}
              framework={cardState.framework}
              feeling={cardState.feeling}
              narrative={narrative}
              smoothDayNote={smoothDayNote}
              smoothDay={smoothDay}
              aiFeedback={aiFeedback}
              suggestion={openSuggestion}
              onRegenerate={
                aiConfigured
                  ? handleRegenerate
                  : undefined
              }
              isRegenerating={isRegenerating}
            />
            {isEditable ? (
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setPhase("form");
                    setSubmitted(false);
                    setCelebrating(false);
                    // Fresh clock for the edit session, so the re-close doesn't
                    // report time-since-the-original-morning-open.
                    setStartedAt(Date.now());
                    resumeConversation(
                      (draftSnapshot ?? {}) as Record<string, unknown>,
                    );
                  }}
                  className="btn btn-outline btn-sm gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit your answers
                </button>
                <span className="text-xs text-base-content/50">
                  {isToday
                    ? "Reopens the questions so you can change anything."
                    : "Yesterday's report can be fixed until 12 noon today, then it locks."}
                </span>
              </div>
            ) : (
              <p className="text-center text-xs text-base-content/40">
                This report is locked. Reports can be edited on their day and
                until 12 noon the day after.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── The stage ──
  // The answers for the active beat — boxless, centred, floated in beneath the
  // question once it has finished revealing. A "Continue" advances; the header
  // back-arrow revisits earlier answers.
  const renderInput = (beat: Beat) => {
    if (beat === "mood") {
      return (
        <div className="flex w-full flex-col items-center gap-6">
          <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
            {feelingMacros.map((m) => {
              const selected = feeling?.macroId === m.id;
              return (
                <motion.button
                  key={m.id}
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => pickMood(m.id, m.label)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-5 transition-colors ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-base-content/10 bg-base-100/40 hover:border-primary/40"
                  }`}
                >
                  <span className="text-4xl" aria-hidden>
                    {feelingEmoji(m.label)}
                  </span>
                  <span className="text-center text-xs font-medium text-base-content/75">
                    {m.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      );
    }

    if (beat === "work") {
      return (
        <div className="flex w-full flex-col gap-4">
          {deliverables.length > 0 ? (
            <CompactChecklist
              deliverables={deliverables}
              onCycleStatus={cycleStatus}
              onAdjustTime={adjustTime}
              onToggleCriticalPath={toggleCriticalPath}
            />
          ) : (
            <p className="text-center text-sm text-base-content/50">
              No planned deliverables found for today.
            </p>
          )}
          {unplanned.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {unplanned.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-warning/25 bg-warning/5 px-3 py-2 text-sm"
                >
                  <span className="truncate text-base-content/80">
                    {u.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-base-content/50">
                    {u.minutesTaken}m
                    <button
                      type="button"
                      onClick={() => removeUnplanned(u.id)}
                      className="btn btn-ghost btn-xs px-1 text-base-content/40"
                      aria-label={`Remove "${u.label}"`}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <UnplannedItemForm onAdd={addUnplanned} />
        </div>
      );
    }

    if (beat === "win") {
      return (
        <div className="flex w-full flex-col items-center gap-3">
          <ChipRow
            multiple
            className="justify-center"
            options={WENT_WELL_CHIPS}
            selectedIds={wentWell}
            onToggle={(o) => setWentWell((prev) => toggleWentWell(prev, o.id))}
            accent="success"
          />
          <p className="text-center text-xs text-base-content/45">
            Pick as many as fit. Optional, so skip it if nothing comes to mind.
          </p>
        </div>
      );
    }

    if (beat === "constraint") {
      return (
        <div className="flex w-full flex-col items-center gap-4">
          <ChipRow
            className="justify-center"
            options={[
              ...constraintMacros,
              {
                id: "__smooth__",
                label: "Nothing, smooth day",
                prefix: <PartyPopper className="h-3.5 w-3.5" aria-hidden />,
              },
            ]}
            selectedId={
              smoothDay ? "__smooth__" : (constraint?.macroId ?? null)
            }
            onPick={(o) => {
              if (o?.id === "__smooth__" || (o === null && smoothDay))
                pickSmoothDay();
              else pickConstraintMacro(o);
            }}
            accent="error"
          />
          <AnimatePresence>
            {constraint && constraintMicros.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex w-full flex-col items-center gap-2 overflow-hidden"
              >
                <p className="text-xs text-base-content/50">
                  More specifically… (optional)
                </p>
                <ChipRow
                  className="justify-center"
                  options={constraintMicros}
                  selectedId={constraint.microId}
                  onPick={pickConstraintMicro}
                  accent="error"
                  size="sm"
                />
              </motion.div>
            )}
            {smoothDay && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full max-w-sm overflow-hidden"
              >
                <MicTextarea
                  value={smoothDayNote}
                  onChange={setSmoothDayNote}
                  placeholder="What kept it smooth? Type or use the mic. (optional)"
                  rows={2}
                  hints={["a habit that helped", "good planning?"]}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (beat === "nav") {
      return (
        <div className="flex w-full flex-col items-center gap-4">
          <ChipRow
            className="justify-center"
            options={navMacros}
            selectedId={navigation?.macroId ?? null}
            onPick={pickNavMacro}
            accent="success"
          />
          {navigation && navMicros.length > 0 && (
            <div className="flex w-full flex-col items-center gap-2">
              <p className="text-xs text-base-content/50">
                More specifically… (optional)
              </p>
              <ChipRow
                className="justify-center"
                options={navMicros}
                selectedId={navigation.microId}
                onPick={pickNavMicro}
                accent="success"
                size="sm"
              />
            </div>
          )}
        </div>
      );
    }

    // deeper — optional, terminal. No Continue; the floating button closes the day.
    return (
      <div className="flex w-full max-w-xl flex-col gap-5">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/50">
            Did a framework help today?
          </p>
          <ChipRow
            className="justify-center"
            options={frameworkMacros}
            selectedId={framework?.macroId ?? null}
            onPick={pickFrameworkMacro}
            accent="info"
            size="sm"
          />
          {framework && frameworkMicros.length > 0 && (
            <div className="max-h-40 w-full overflow-y-auto">
              <ChipRow
                className="justify-center"
                options={frameworkMicros}
                selectedId={framework.microId}
                onPick={pickFrameworkMicro}
                accent="info"
                size="sm"
              />
            </div>
          )}
        </div>
        {/* When somebody has named no blocker and written nothing anywhere, we
            reach the end of their report knowing what they did and nothing
            about how it went. That is the report that produces a generic
            suggestion, because there is nothing specific to build one from.

            So the question changes rather than a new one being added: it says
            plainly that nothing was flagged, and says what the answer is FOR.
            "Anything worth remembering?" gives somebody no reason to type. "This
            is what tomorrow's learning is built from" gives them one.

            Submission enforces the required explanation in a separate dialog
            when no bottleneck is named or a framework is selected. */}
        <div className="flex flex-col gap-1.5">
          <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-base-content/50">
            {unexplainedDay ? "How did today actually go?" : "Anything worth remembering?"}
          </p>
          <MicTextarea
            value={narrative}
            onChange={setNarrative}
            maxWords={Infinity}
            placeholder={
              unexplainedDay
                ? "Nothing was flagged today, so tell us in your own words. Type or tap the mic and talk."
                : "Type or tap the mic and just talk. What happened, and what you took from it."
            }
            rows={3}
            minWords={12}
            hints={
              unexplainedDay
                ? ["how the day felt", "anything that got in the way", "what you thank yourself for"]
                : ["what made it hard or easy", "what you'd do differently", "what you thank yourself for"]
            }
          />
          {unexplainedDay && (
            <p className="text-center text-xs text-base-content/45">
              Your explanation helps guide tomorrow&apos;s learning. At least {MIN_REPORT_EXPLANATION_CHARS} characters in total are required when no bottleneck is named or a framework is selected.
            </p>
          )}
        </div>
        <p className="text-center text-xs text-base-content/40">
          Close your day below whenever you&apos;re ready. 🌱
        </p>
      </div>
    );
  };

  const questionText = companionByBeat[activeBeat] ?? "";
  // The last beat's primary button submits ("Close my day"); earlier beats show
  // "Continue". Mood auto-advances on tap the first time, so it needs no button.
  const isFinalStep = activeBeat === activeOrder[activeOrder.length - 1];
  const moodAutoStep = activeBeat === "mood" && furthest === "mood";
  const closeLabel = submitPending
    ? "Closing…"
    : submitted
      ? "Save changes"
      : "Close my day 🌱";

  return (
    // Fill the content area (below the app header, right of the sidebar) so the
    // experience feels full screen without covering the header or sidebar.
    <div className="fixed inset-x-0 bottom-0 top-14 z-20 flex flex-col overflow-hidden bg-base-100 lg:left-76">
      {/* Atmospheric backdrop: mood-tinted wash + blurred glass orbs. */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b transition-colors duration-1000 ${BG_BY_VALENCE[moodValence]}`}
      />
      <div className="pointer-events-none absolute inset-0 opacity-90 blur-2xl">
        <ParticleField density={24} />
      </div>

      {/* The arrival moment. */}
      <AnimatePresence>
        {!introDismissed && (
          <CinematicIntro
            name={name}
            hour={new Date().getHours()}
            streakLabel={streakLabel}
            onStart={() => setIntroDismissed(true)}
          />
        )}
      </AnimatePresence>

      {introDismissed && (
        <div className="relative z-10 flex h-full flex-col overflow-y-auto">
          {/* Controls row, right aligned at the top of the content area. */}
          <div className="flex shrink-0 items-center justify-end gap-2 px-4 py-3">
            <GrowthPlant />
            <DayNavigator
              currentDate={currentDate}
              todayISO={todayISO}
              onPrev={goToPrevDay}
              onNext={goToNextDay}
              onJump={jumpToDate}
            />
            <Link
              href="/aavahana/settings/ai-coach"
              className="btn btn-ghost btn-xs gap-1 text-base-content/40"
              title={aiConfigured ? "AI: on" : "AI off, tap to set up"}
            >
              <SparklesIcon size="xs" />
              <span>{aiConfigured ? "AI" : "AI off"}</span>
            </Link>
          </div>

          {/* Yesterday nudge: informative, tappable, never blocking. */}
          {yesterdayStillOpen && (
            <button
              type="button"
              onClick={() => jumpToDate(yesterdayISO)}
              className="mx-auto flex shrink-0 items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-4 py-2 text-sm text-base-content/80 transition-colors hover:bg-warning/15"
            >
              Yesterday&apos;s report is still open until 12 noon. Finish it
              first?
            </button>
          )}

          {/* Learning check-in: "last time we suggested X, did you get to it?"
              Never blocks. Dismissable, every answer optional, and ignoring it
              entirely has no consequence anywhere in the system. */}
          <AnimatePresence>
            {showCheckIn && openSuggestion && (
              <SuggestionCheckIn
                suggestion={openSuggestion}
                deferReasons={suggestionData?.deferReasons ?? []}
                onRespond={handleSuggestionRespond}
                onDismiss={() => setCheckInDismissed(true)}
              />
            )}
          </AnimatePresence>

          {/* The single-question stage, centred in the remaining height. When
              support is open it takes this space instead, and closing it
              returns to exactly the question they left. Support is mounted
              on first open and only hidden after that, so its conversation
              is still there if they come back during this visit. Nothing in
              it is saved; leaving the page clears it. */}
          {supportMounted && (
            <div
              ref={supportWrap}
              hidden={!supportOpen}
              className={
                supportOpen
                  ? "flex flex-1 flex-col items-center justify-center px-6 py-6"
                  : undefined
              }
            >
              <SupportChat
                key={`${supportOwner}:${currentDate}`}
                date={currentDate}
                report={reportDraft}
                dictionaries={dictionaries ?? null}
                wentWellOptions={WENT_WELL_CHIPS}
                reportHelpAvailable={isEditable && deliverables.length > 0}
                onUseDraft={(draft) => {
                  applyDraft(draft);
                  setSupportOpen(false);
                }}
                onSubmitDraft={(draft) => {
                  // Close support first, as the other submit does, so the
                  // written explanation, when due, opens over the report.
                  applyDraft(draft);
                  setSupportOpen(false);
                  setSubmitAfterApply(true);
                }}
                canSubmit={canSubmit}
                submitting={submitPending}
                submitHint={
                  statusesDone
                    ? null
                    : "Mark how your tasks went first, then you can submit from here."
                }
                onBack={() => setSupportOpen(false)}
                onSubmit={() => {
                  // Close support first, so that if the report still needs its
                  // written explanation, that box opens over the report itself.
                  setSupportOpen(false);
                  runSubmit();
                }}
              />
            </div>
          )}
          {!supportOpen && (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-6">
            {currentDate === getTodayISO() && supportOwner && (
              <CareFollowUp key={supportOwner} owner={supportOwner} onMoreSupport={openSupport} />
            )}
            {/* Progress — a pip per beat plus a plain "Step X of Y" so there's
                never any doubt how much is left. */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                {activeOrder.map((b, i) => (
                  <span
                    key={b}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeIdx
                        ? "w-8 bg-primary"
                        : i < activeIdx
                          ? "w-3 bg-primary/50"
                          : "w-3 bg-base-content/15"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-medium tracking-wide text-base-content/50">
                Step {activeIdx + 1} of {activeOrder.length}
              </p>
            </div>

            <div data-clarity-mask={activeBeat === "mood" ? "true" : undefined}
              className="flex w-full max-w-2xl flex-col items-center gap-8">
              <QuestionReveal
                key={`${activeBeat}:${questionText}`}
                text={questionText}
                onRevealed={() => setQuestionRevealed(true)}
              />

              {/* Answers stay mounted so their space is reserved; they simply fade
                  in when the question finishes revealing. Nothing jumps. */}
              <div
                className={`flex w-full flex-col items-center transition-all duration-500 ease-out ${
                  questionRevealed
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0"
                }`}
              >
                {renderInput(activeBeat)}
                {!quickClose && (
                  <Button color="neutral" variant="ghost" className="mt-4" onClick={openSupport}>
                    I could use some support
                  </Button>
                )}

                {/* One primary button that reads as forward motion: "Continue"
                    on every step, becoming "Close my day" on the last one. No
                    standalone close appears early — a quick exit lives behind
                    "wrap up now", which always captures a line first. */}
                <div className="mt-8 flex w-full max-w-sm flex-col items-center gap-3">
                  {quickClose ? (
                    <>
                      <MicTextarea
                        value={narrative}
                        onChange={setNarrative}
                        maxWords={Infinity}
                        placeholder="Before you go, sum up your day. Type or tap the mic and talk."
                        rows={3}
                        autoFocus
                        minChars={MIN_REPORT_EXPLANATION_CHARS}
                        hints={["your biggest win or blocker", "what you thank yourself for"]}
                      />
                      <button
                        type="button"
                        onClick={runSubmit}
                        disabled={!canSubmit}
                        className="btn btn-primary w-full rounded-full px-8 shadow-lg shadow-primary/25 disabled:opacity-40"
                      >
                        {closeLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickClose(false)}
                        className="text-xs text-base-content/50 underline-offset-2 hover:underline"
                      >
                        actually, keep going
                      </button>
                    </>
                  ) : (
                    <>
                      {isFinalStep ? (
                        <button
                          type="button"
                          onClick={runSubmit}
                          disabled={!canSubmit}
                          className="btn btn-primary rounded-full px-8 shadow-lg shadow-primary/25 disabled:opacity-40"
                        >
                          {closeLabel}
                        </button>
                      ) : (
                        !moodAutoStep && (
                          <button
                            type="button"
                            onClick={() => advanceFrom(activeBeat)}
                            disabled={!beatAnswered[activeBeat]}
                            className="btn btn-primary rounded-full px-8 shadow-lg shadow-primary/25 disabled:opacity-40"
                          >
                            Continue →
                          </button>
                        )
                      )}

                      {/* Quick exit: only once there's a day worth closing, and
                          never on the final step (Continue already closes there). */}
                      {statusesDone && !isFinalStep && (
                        <button
                          type="button"
                          onClick={() => setQuickClose(true)}
                          className="text-xs text-base-content/50 underline-offset-2 hover:underline"
                        >
                          I&apos;d rather just wrap up now
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={goBack}
                    className="mt-1 inline-flex items-center gap-1 rounded-full border border-base-content/15 bg-base-100/70 px-4 py-2 text-sm font-medium text-base-content shadow-sm backdrop-blur-md transition hover:bg-base-100"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {submitError && !explanationOpen && <p role="alert" className="p-4 text-error">{submitError} You can retry without re-entering your report.</p>}
      {explanationOpen && (
        <ReportExplanationDialog
          key={`${supportOwner}:${currentDate}`}
          value={narrative}
          onChange={setNarrative}
          earlierNote={smoothDayNote}
          frameworkLabel={framework?.microLabel ?? framework?.macroLabel}
          pending={submitPending}
          error={submitError}
          onSubmit={runSubmit}
          onBack={() => setExplanationOpen(false)}
        />
      )}

      {/* While the AI coach is generating (a key is configured), hold the wait
          with rotating inspiration instead of a bare spinner. */}
      <AnimatePresence>
        {submitPending &&
          aiConfigured && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex items-center justify-center bg-base-100/85 px-6 backdrop-blur-md"
            >
              <GeneratingInsights />
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
