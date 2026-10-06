"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatMins } from "@/types/aavahana/report-v5.types";
import { feelingValence, type Valence } from "./companion/reactions";
import { GeneratingInsights } from "../../GeneratingInsights";
import { cn } from "@/utils";
import type {
  PlannedDeliverable,
  UnplannedDeliverable,
  MacroMicroSelection,
} from "@/types/aavahana/report-engine.types";
import type { AiFeedback } from "@/types/aavahana/report-v7.types";
import { type LearningSuggestion } from "@/types/aavahana/learning.types";
import { SuggestionCard } from "./learning/SuggestionCard";
import { useRespondToSuggestion } from "@/lib/hooks/aavahana/use-report-v7";
import { Button } from "@/components/shared/Button";

interface DailyReportSummaryProps {
  dateLabel: string;
  streakDays: number;
  durationSecs: number | null;
  deliverables: PlannedDeliverable[];
  unplanned: UnplannedDeliverable[];
  constraint: MacroMicroSelection | null;
  navigation: MacroMicroSelection | null;
  framework: MacroMicroSelection | null;
  feeling: MacroMicroSelection | null;
  narrative: string;
  smoothDayNote: string;
  smoothDay: boolean;
  aiFeedback: AiFeedback | null;
  /**
   * The one suggestion this person currently holds. Replaces the old panel,
   * which listed ten to fifteen items behind a collapsed line and recorded
   * nothing about whether any of them were read.
   */
  suggestion?: LearningSuggestion | null;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const VALENCE_DOT: Record<Valence, string> = {
  positive: "bg-success",
  neutral: "bg-info",
  negative: "bg-warning",
};

const STATUS_DOT: Record<"done" | "partial" | "not_done", string> = {
  done: "bg-success",
  partial: "bg-warning",
  not_done: "bg-base-300",
};

/** Single-ratio meter: accent fill on a lighter step of the same hue. */
function Meter({
  ratio,
  over = false,
  className,
}: {
  ratio: number; // 0..1 (clamped)
  over?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-primary/15", className)}
      role="presentation"
    >
      <div
        className={cn("h-full rounded-full", over ? "bg-warning" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** KPI stat tile: small label, prominent value, optional meter/sub. */
function StatTile({
  label,
  value,
  sub,
  dotClass,
  meter,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  dotClass?: string;
  meter?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-2 px-5 py-4">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-base-content/40">
        {label}
      </span>
      <span className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-base-content">
        {dotClass && <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />}
        <span className="truncate">{value}</span>
      </span>
      {meter ?? (
        <span className="min-h-[0.875rem] truncate text-xs text-base-content/45">
          {sub ?? ""}
        </span>
      )}
    </div>
  );
}

/** A step in the day's journey: friction → navigation → framework. */
function JourneyChip({
  tone,
  children,
}: {
  tone: "warning" | "success" | "info" | "neutral";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    warning: "border-warning/40 bg-warning/5 text-base-content/80",
    success: "border-success/40 bg-success/5 text-base-content/80",
    info: "border-info/40 bg-info/5 text-base-content/80",
    neutral: "border-base-300 bg-base-200/50 text-base-content/70",
  };
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-lg border px-3 py-1.5 text-sm font-medium",
        tones[tone],
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * The post-submission report as a one-screen visual dashboard: a KPI row of
 * stat tiles with meters, the work as rows with inline progress, the friction
 * story as a chip path, and the coaching collapsed behind toggles. Numbers and
 * marks first; prose only where it earns the space.
 */
export function DailyReportSummary({
  dateLabel,
  streakDays,
  durationSecs,
  deliverables,
  unplanned,
  constraint,
  navigation,
  framework,
  feeling,
  narrative,
  smoothDayNote,
  smoothDay,
  aiFeedback,
  suggestion,
  onRegenerate,
  isRegenerating = false,
}: DailyReportSummaryProps) {


  const total = deliverables.length;
  const doneCount = deliverables.filter((d) => d.status === "done").length;
  const plannedMins = deliverables.reduce((s, d) => s + d.estimateMins, 0);
  const actualMins =
    deliverables.reduce((s, d) => s + d.actualMins, 0) +
    unplanned.reduce((s, u) => s + u.minutesTaken, 0);
  const overPlan = plannedMins > 0 && actualMins > plannedMins;
  const valence: Valence | null = feeling
    ? feelingValence(feeling.macroLabel)
    : null;

  // The day's most important task, for the fourth KPI tile.
  const cpTask = deliverables.find((d) => d.isCriticalPath) ?? null;
  const cpStatus = (cpTask?.status ?? "not_done") as keyof typeof STATUS_DOT;
  const CP_WORD: Record<keyof typeof STATUS_DOT, string> = {
    done: "Done",
    partial: "Partial",
    not_done: "Open",
  };

  // Duration is wall-clock for the sit-down; anything over 30 minutes means the
  // tab sat open (breaks, meetings) and would misreport, so it's hidden then.
  const showDuration =
    durationSecs !== null && durationSecs > 0 && durationSecs <= 30 * 60;
  const durationLabel = showDuration
    ? `closed in ${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, "0")}`
    : null;

  const words = narrative.trim() || smoothDayNote.trim();

  // ── AI content ──
  const status = aiFeedback?.status;
  const appreciation = aiFeedback?.reflection?.appreciation ?? null;
  const nudgeMessages = aiFeedback?.nudge?.nudgeMessages ?? [];
  const remaining = aiFeedback?.regenerateRemaining ?? 0;
  const canRetry = Boolean(onRegenerate) && remaining > 0;

  const retryLink = canRetry ? (
    <button
      type="button"
      onClick={onRegenerate}
      disabled={isRegenerating}
      className="text-xs font-medium text-base-content/45 underline-offset-2 transition-colors hover:text-primary hover:underline disabled:opacity-50"
    >
      {isRegenerating ? "Regenerating…" : `Regenerate (${remaining} left)`}
    </button>
  ) : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-base-200 bg-base-100">
      {/* The suggestion, first and full width.
          It used to sit last in the right-hand sidebar under "Friction", in the
          same small grey type as everything else, which is the least noticeable
          place on the screen. Nobody opened it. It is now the first thing after
          the day is closed, at full width, and nothing about it is hidden. */}
      {!isRegenerating && <SuggestionOffer suggestion={suggestion ?? null} />}

      {/* ── Header band ── */}
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-base-200 px-6 py-4 lg:px-8">
        <div className="flex items-baseline gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-base-content/40">
            Daily report
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-base-content">
            {dateLabel}
          </h1>
        </div>
        {(streakDays > 1 || durationLabel) && (
          <p className="text-sm font-medium text-base-content/55">
            {[streakDays > 1 ? `${streakDays} days in a row` : null, durationLabel]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        )}
      </header>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 divide-x divide-base-200 border-b border-base-200 lg:grid-cols-4">
        <StatTile
          label="Tasks"
          value={total > 0 ? `${doneCount}/${total}` : "0"}
          meter={total > 0 ? <Meter ratio={doneCount / total} /> : undefined}
          sub={total === 0 ? "none planned" : undefined}
        />
        <StatTile
          label="Time"
          value={formatMins(actualMins)}
          meter={
            plannedMins > 0 ? (
              <Meter ratio={actualMins / plannedMins} over={overPlan} />
            ) : undefined
          }
          sub={
            plannedMins > 0
              ? undefined
              : actualMins > 0
                ? "no estimate set"
                : "no time logged"
          }
        />
        <StatTile
          label="Mood"
          value={feeling ? feeling.macroLabel : "—"}
          dotClass={valence ? VALENCE_DOT[valence] : undefined}
          sub={feeling?.microLabel && feeling.microLabel !== feeling.macroLabel ? feeling.microLabel : undefined}
        />
        <StatTile
          label="Priority"
          value={cpTask ? CP_WORD[cpStatus] : "—"}
          dotClass={cpTask ? STATUS_DOT[cpStatus] : undefined}
          sub={cpTask ? cpTask.label : "none marked"}
        />
      </div>

      {/* ── The AI's one sentence ── */}
      {isRegenerating ? (
        <div className="flex justify-center border-b border-base-200 px-6 py-5 lg:px-8">
          <GeneratingInsights compact caption="Rewriting the coaching notes on this report." />
        </div>
      ) : (
        appreciation && (
          <div className="border-b border-base-200 px-6 py-4 lg:px-8">
            <p className="max-w-4xl border-l-2 border-primary/50 pl-4 text-base font-medium leading-relaxed text-base-content/90">
              {appreciation}
            </p>
          </div>
        )
      )}

      {/* ── Body: work left, story + coaching right ── */}
      <div className="lg:grid lg:grid-cols-12">
        {/* Main: the work */}
        <div className="flex flex-col gap-6 px-6 py-5 lg:col-span-7 lg:border-r lg:border-base-200 lg:px-8">
          {(deliverables.length > 0 || unplanned.length > 0) && (
            <section className="flex flex-col gap-2">
              <SectionLabel>The day&apos;s work</SectionLabel>
              <ul className="flex flex-col">
                {deliverables.map((d) => {
                  const st = (d.status ?? "not_done") as keyof typeof STATUS_DOT;
                  const over = d.actualMins > d.estimateMins;
                  return (
                    <li
                      key={d.id}
                      className="flex items-center gap-3 border-b border-base-200/60 py-2.5 last:border-0"
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[st]}`} />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm",
                          st === "done"
                            ? "text-base-content/45 line-through"
                            : "text-base-content/80",
                        )}
                      >
                        {d.label}
                        {d.isCriticalPath && (
                          <span className="ml-2 rounded border border-primary/30 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                            Priority
                          </span>
                        )}
                      </span>
                      {d.estimateMins > 0 && (
                        <Meter
                          ratio={d.actualMins / d.estimateMins}
                          over={over}
                          className="hidden w-24 shrink-0 sm:block"
                        />
                      )}
                      <span className="w-20 shrink-0 text-right text-xs tabular-nums text-base-content/45">
                        <span className={over ? "text-warning" : undefined}>
                          {formatMins(d.actualMins)}
                        </span>
                        <span className="text-base-content/30">
                          {" "}
                          / {formatMins(d.estimateMins)}
                        </span>
                      </span>
                    </li>
                  );
                })}
                {unplanned.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 border-b border-base-200/60 py-2.5 last:border-0"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-base-300" />
                    <span className="min-w-0 flex-1 truncate text-sm text-base-content/70">
                      {u.label}
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-base-content/35">
                        unplanned
                      </span>
                    </span>
                    <span className="w-20 shrink-0 text-right text-xs tabular-nums text-base-content/45">
                      {formatMins(u.minutesTaken)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {words && (
            <section className="flex flex-col gap-2">
              <SectionLabel>In your words</SectionLabel>
              <blockquote className="whitespace-pre-wrap break-words border-l-2 border-base-300 pl-4 text-sm leading-relaxed text-base-content/70">
                {words}
              </blockquote>
            </section>
          )}
        </div>

        {/* Rail: the story + coaching */}
        <aside className="flex flex-col gap-6 border-t border-base-200 px-6 py-5 lg:col-span-5 lg:border-t-0 lg:px-8">
          {/* The day's story as a chip path, not text rows */}
          {(smoothDay || constraint) && (
            <section className="flex flex-col gap-2">
              <SectionLabel>Friction</SectionLabel>
              {smoothDay ? (
                <JourneyChip tone="success">Smooth day, nothing in the way</JourneyChip>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <JourneyChip tone="warning">
                    {constraint!.microLabel || constraint!.macroLabel}
                  </JourneyChip>
                  {navigation && (
                    <>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-base-content/30" aria-hidden />
                      <JourneyChip tone="success">
                        {navigation.microLabel || navigation.macroLabel}
                      </JourneyChip>
                    </>
                  )}
                  {framework && (
                    <>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-base-content/30" aria-hidden />
                      <JourneyChip tone="info">
                        {framework.microLabel || framework.macroLabel}
                      </JourneyChip>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {!isRegenerating && nudgeMessages.length > 0 && (
            <section className="flex flex-col gap-1.5 border-l-2 border-warning/60 pl-3">
              <SectionLabel>Before you go</SectionLabel>
              <p className="text-sm leading-relaxed text-base-content/70">
                {nudgeMessages[0]}
              </p>
            </section>
          )}

          {/* AI quiet states */}
          {!isRegenerating && status === "skipped" && (
            <section className="flex items-center justify-between gap-3">
              <p className="text-xs text-base-content/45">
                {onRegenerate
                  ? "AI coaching was off when you submitted."
                  : "Add your AI key to get coaching notes."}
              </p>
              {onRegenerate ? (
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="btn btn-xs btn-outline"
                >
                  Generate
                </button>
              ) : (
                <Link href="/aavahana/settings/ai-coach" className="btn btn-xs btn-outline">
                  Set up AI
                </Link>
              )}
            </section>
          )}
          {!isRegenerating &&
            status === "errored" &&
            !suggestion &&
            !appreciation && (
              <section className="flex items-center justify-between gap-3">
                <p className="text-xs text-base-content/45">
                  Coaching notes couldn&apos;t be generated right now.
                </p>
                {retryLink}
              </section>
            )}
          {!isRegenerating && suggestion && (
            <div className="flex justify-end">{retryLink}</div>
          )}
          {aiFeedback?.quotaWarning && (
            <p className="text-[11px] text-warning/80">
              Over your monthly AI token allowance. Usage continues on your own
              provider key.
            </p>
          )}
        </aside>
      </div>
    </article>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-base-content/45">
      {children}
    </h2>
  );
}

type Decision = "accepted" | "dropped";
type Swipe = "left" | "right" | null;

/**
 * How the card leaves once they decide. "I will do" sits on the left and "I
 * will pass" on the right, so the card goes the way of the button they pressed
 * and the movement confirms which one counted. With reduced motion it fades.
 */
const offerMotion: Variants = {
  enter: { opacity: 0 },
  shown: { opacity: 1, x: 0, rotate: 0 },
  gone: (swipe: Swipe) =>
    swipe
      ? {
          x: swipe === "left" ? "-115%" : "115%",
          rotate: swipe === "left" ? -6 : 6,
          opacity: 0,
          pointerEvents: "none",
          transition: { duration: 0.35, ease: "easeIn" },
        }
      : { opacity: 0, pointerEvents: "none", transition: { duration: 0.15 } },
};

/**
 * Today's suggestion with its do-or-pass decision, and the swipe that answers
 * the tap.
 *
 * The card moves the moment they tap, not when the server replies, because a
 * tap that shows nothing for half a second reads as a missed tap. If the save
 * fails, the card comes back with a line saying so, so a choice never silently
 * fails to count. The save lives here rather than in the buttons because this
 * stays on screen while the card swipes away, and the result of a save must not
 * be lost with the card.
 *
 * "I will do" swipes left and the same card comes back marked as theirs: they
 * may still want to open the reading or video they just agreed to. "I will
 * pass" swipes right and the card is gone, which is what making room for a
 * different suggestion looks like.
 */
export function SuggestionOffer({
  suggestion,
}: {
  suggestion: LearningSuggestion | null;
}) {
  const respond = useRespondToSuggestion();
  const reduceMotion = useReducedMotion();
  const [choice, setChoice] = React.useState<{
    id: string;
    action: Decision;
    at: string;
  } | null>(null);
  const [failedId, setFailedId] = React.useState<string | null>(null);
  // The card swiping away keeps its buttons for a moment, and their handlers
  // were made before the tap, so they would still see no choice in state. A
  // ref is what every copy sees, which stops a second tap counting twice.
  const deciding = React.useRef<string | null>(null);

  const decide = (action: Decision) => {
    if (!suggestion || deciding.current === suggestion.id) return;
    const id = suggestion.id;
    deciding.current = id;
    setFailedId(null);
    setChoice({ id, action, at: new Date().toISOString() });
    respond.mutate(
      { suggestionId: id, action },
      {
        onError: () => {
          deciding.current = null;
          setChoice(null);
          setFailedId(id);
        },
      },
    );
  };

  // What is on screen, a step ahead of the server: gone after a pass, marked as
  // theirs after a do. The refetched suggestion takes over when it arrives.
  let shown = suggestion;
  if (suggestion && choice?.id === suggestion.id) {
    if (choice.action === "dropped") shown = null;
    else if (!suggestion.acceptedAt) shown = { ...suggestion, acceptedAt: choice.at };
  }
  const swipe: Swipe =
    reduceMotion || !choice ? null : choice.action === "accepted" ? "left" : "right";

  return (
    <section
      aria-label="Today's suggestion"
      data-swipe={swipe ?? undefined}
      className="border-b border-base-200 p-4 empty:hidden sm:p-5"
    >
      <AnimatePresence mode="wait" initial={false} custom={swipe}>
        {shown && (
          <motion.div
            key={`${shown.id}:${shown.acceptedAt ? "accepted" : "open"}`}
            custom={swipe}
            variants={offerMotion}
            initial="enter"
            animate="shown"
            exit="gone"
          >
            <SuggestionCard suggestion={shown} />
            <SuggestionDecision
              suggestion={shown}
              busy={respond.isPending}
              failed={failedId === shown.id}
              onDecide={decide}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * The offer-time decision for every suggestion and challenge (PRD §6).
 *
 * WHY A BUTTON AT ALL, WHEN NOTHING ENFORCES IT
 * Saying you will do something changes whether you do it, and it costs one tap.
 * That is the whole mechanism. Nothing chases them afterwards and nothing is
 * held against them if they do not; the next report asks how it went either
 * way.
 *
 * WHY IT MATTERS BEYOND THE PERSON
 * Until now a challenge that was shown and never acted on was one number. It is
 * two very different failures: nobody wanted it, or people wanted it and could
 * not fit it in. The first is a content problem, the second is a size problem,
 * and they need opposite fixes. This button is what separates them.
 *
 * "I will do" keeps the item open until they say what happened. "I will pass"
 * closes it immediately, so a suggestion the person does not want cannot trap
 * the learning slot. The saving happens in SuggestionOffer.
 */
export function SuggestionDecision({
  suggestion,
  busy,
  failed,
  onDecide,
}: {
  suggestion: LearningSuggestion;
  busy: boolean;
  failed: boolean;
  onDecide: (action: Decision) => void;
}) {
  if (suggestion.acceptedAt) {
    return (
      <p className="mt-2 px-1 text-xs text-base-content/45">
        We&apos;ll ask how it went next time you report.
      </p>
    );
  }

  return (
    <>
      <div className="mt-3 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            color="primary"
            size="sm"
            className="rounded-full px-5"
            disabled={busy}
            onClick={() => onDecide("accepted")}
          >
            I will do
          </Button>
          <Button
            variant="ghost"
            color="neutral"
            size="sm"
            className="rounded-full px-5 text-base-content/60"
            disabled={busy}
            onClick={() => onDecide("dropped")}
          >
            I will pass
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-base-content/45 sm:text-right">
          Do keeps it for follow-up. Pass makes room for a different suggestion.
        </p>
      </div>
      {failed && (
        <p role="alert" className="mt-2 px-1 text-xs text-error">
          That didn&apos;t save. Please try again.
        </p>
      )}
    </>
  );
}
