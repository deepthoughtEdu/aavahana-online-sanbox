"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Repeat,
  BookOpen,
  PlayCircle,
  Target,
  ChevronDown,
} from "lucide-react";
import { SparklesIcon } from "@/components/shared/icons";
import { GeneratingInsights } from "@/components/aavahana/report/GeneratingInsights";
import type {
  AiFeedback,
  AiFrameworkSuggestion,
  AiGrowthRecommendations,
  AiHabitSuggestion,
  AiResourceSuggestion,
  AiRubricScore,
  AiScoring,
  AiSkillSuggestion,
} from "@/types/aavahana/report-v7.types";
import { cn } from "@/utils";
import { FileAsImprovementObject } from "@/components/hcd/FileAsImprovementObject";

interface AiReflectionPanelProps {
  aiFeedback: AiFeedback | null;
  /** Submitted report id — sources the heroics→constraint filing (W2.3). */
  reportId?: string | null;
  isLoading: boolean;
  /** Click handler for the "Try again" button. Omit to hide the button. */
  onRegenerate?: () => void;
  /** True while a regenerate is in flight — disables the button + shows spinner. */
  isRegenerating?: boolean;
}

const RUBRIC_LABELS: { key: keyof Omit<AiRubricScore, "total">; label: string }[] =
  [
    { key: "clarity", label: "Clarity" },
    { key: "selfAwareness", label: "Self-awareness" },
    { key: "learning", label: "Learning" },
    { key: "specificity", label: "Specificity" },
  ];

const P_LABELS: {
  key: keyof NonNullable<AiScoring["scores"]>;
  label: string;
}[] = [
  { key: "P1_effort_estimation", label: "Effort estimation" },
  { key: "P2_bottleneck_identification", label: "Bottleneck identification" },
  { key: "P3_course_correction", label: "Course correction" },
  { key: "P4_self_transformation", label: "Self-transformation" },
];

const GROUNDING_LABEL: Record<string, string> = {
  linked_constraint: "Linked constraint",
  peer_experiment: "Peer experiment",
  lnd_module: "LDI module",
};

// Heroics signal categories (from the backend classifier) → a plain-language
// phrase, used only to pre-fill the filing title so it's one-tap fileable and
// still editable. Grounded in the detected signal, never fabricated.
const HEROICS_CATEGORY_PHRASE: Record<string, string> = {
  urgency: "urgent firefighting",
  unplanned: "unplanned interruptions",
  recurrence: "recurring manual work",
  heroism: "individual heroics",
};

/** Seed a constraint title from the detected heroics categories. */
function heroicsDefaultTitle(categories: string[]): string {
  const phrases = categories
    .map((c) => HEROICS_CATEGORY_PHRASE[c])
    .filter(Boolean);
  if (phrases.length === 0) return "Work required firefighting";
  return `Firefighting: ${phrases.join(", ")}`;
}

/** 5-dot gentle score display (0–5) — progress framing, not a raw grade. */
function ScoreDots({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex gap-1" aria-label={`${v} of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full",
            i < v ? "bg-primary" : "bg-base-300",
          )}
        />
      ))}
    </span>
  );
}

/**
 * The exit doorway — advisory AI reflection feedback shown after the report is
 * submitted. The deterministic engine owns the report; this is a coaching layer
 * on top. Renders purely by switching on `aiFeedback.status`.
 */
export function AiReflectionPanel({
  aiFeedback,
  reportId,
  isLoading,
  onRegenerate,
  isRegenerating = false,
}: AiReflectionPanelProps) {
  const [showSignals, setShowSignals] = useState(false);

  // Loading — hold the wait with rotating inspiration instead of a dead spinner.
  if (isLoading && !aiFeedback) {
    return (
      <div className="mx-auto mt-2 flex w-full max-w-md justify-center rounded-2xl border border-base-200 p-6">
        <GeneratingInsights compact />
      </div>
    );
  }

  if (!aiFeedback) return null;

  const { status } = aiFeedback;

  // Skipped — AI was off at submit. Two sub-cases:
  //  1. BYOK already configured (onRegenerate truthy) → one-click "Generate AI
  //     feedback" CTA using the same /regenerate-ai endpoint.
  //  2. BYOK not configured yet → "Set up AI key" CTA linking to settings, so
  //     users discover the feature instead of seeing nothing.
  if (status === "skipped") {
    const headline = onRegenerate
      ? "Want AI feedback on this report?"
      : "AI feedback isn't set up yet";
    const body = onRegenerate
      ? "AI was off when you submitted. Generate reflection feedback now using your AI key."
      : "Add your provider API key in settings to get reflection feedback on this report.";
    return (
      <div className="dt-rise mt-2 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-base-200 bg-base-100 px-5 py-6 text-center">
        <span className="text-primary">
          <SparklesIcon size="sm" />
        </span>
        <p className="text-sm font-medium text-base-content/70">{headline}</p>
        <p className="max-w-sm text-xs text-base-content/50">{body}</p>
        {onRegenerate ? (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="btn btn-sm btn-primary mt-1"
          >
            {isRegenerating ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                Generating…
              </>
            ) : (
              "Generate AI feedback"
            )}
          </button>
        ) : (
          <Link
            href="/aavahana/settings/ai-coach"
            className="btn btn-sm btn-primary mt-1"
          >
            Set up AI key
          </Link>
        )}
      </div>
    );
  }

  const reflection = aiFeedback.reflection ?? null;
  const nudge = aiFeedback.nudge ?? null;
  const scoring = aiFeedback.scoring ?? null;
  const frameworkSuggestions = aiFeedback.frameworkSuggestions ?? [];
  const growth =
    aiFeedback.growthRecommendations ??
    ({ skills: [], habits: [], reading: [], viewing: [] } as AiGrowthRecommendations);
  const grounding = aiFeedback.grounding ?? [];
  const hasSignals = Boolean(reflection?.rubricScore || scoring?.scores);
  // What actually has content to render? "errored" overall status often still
  // carries useful partial data — e.g. when Gemini returns 503 for prompt A
  // and B but prompt C (Growth Coach) succeeded, frameworks + growth are real.
  // Only show the "unavailable" placeholder when there's truly nothing.
  const hasAnyContent = Boolean(
    reflection?.appreciation ||
      (reflection?.suggestions?.length ?? 0) > 0 ||
      hasSignals ||
      frameworkSuggestions.length > 0 ||
      growth.skills.length > 0 ||
      growth.habits.length > 0 ||
      growth.reading.length > 0 ||
      growth.viewing.length > 0 ||
      (status === "needs_nudge" && nudge),
  );

  // The "Try again" control — reused by both the errored-empty placeholder
  // below and the populated panel. Non-null only when a retry is actually
  // possible: BYOK wired via onRegenerate AND backend retry budget remaining.
  const remaining = aiFeedback.regenerateRemaining ?? 0;
  const canRetry = Boolean(onRegenerate) && remaining > 0;
  const retryButton = canRetry ? (
    <button
      type="button"
      onClick={onRegenerate}
      disabled={isRegenerating}
      className="dt-hover-teal btn btn-xs btn-ghost gap-1.5 text-base-content/60 hover:text-primary"
    >
      {isRegenerating ? (
        <>
          <span className="loading loading-spinner loading-xs" />
          Trying again…
        </>
      ) : (
        `Try again (${remaining} left)`
      )}
    </button>
  ) : null;

  // Total AI failure with nothing to render. This is exactly when the user most
  // wants to retry, so surface the action here rather than a dead-end message —
  // the populated panel's Try-again button sits below this early return.
  if (status === "errored" && !hasAnyContent) {
    return (
      <div className="dt-rise mt-2 flex w-full flex-col items-center gap-3 rounded-2xl border border-base-200 bg-base-100 px-5 py-6 text-center">
        <p className="text-xs text-base-content/50">
          AI reflection couldn&apos;t be generated right now.
        </p>
        {canRetry ? (
          retryButton
        ) : onRegenerate ? (
          <p className="text-[11px] text-base-content/40">
            You&apos;ve used all retries for this report.
          </p>
        ) : (
          <Link
            href="/aavahana/settings/ai-coach"
            className="btn btn-xs btn-primary"
          >
            Set up AI key
          </Link>
        )}
      </div>
    );
  }

  // Visual hierarchy buckets — populated up here so the JSX below stays
  // declarative and the conditional logic doesn't compete with rendering.
  const hasTomorrowActions = frameworkSuggestions.length > 0;
  const hasGrowthDirection =
    growth.skills.length > 0 || growth.habits.length > 0;
  const hasResources = growth.reading.length > 0 || growth.viewing.length > 0;
  const hasDetailedSignals =
    hasSignals ||
    (reflection?.suggestions && reflection.suggestions.length > 0);
  // Drives the partial-data notice + Try-again button. We treat any per-prompt
  // error as "something to retry" regardless of the overall status — covers
  // the needs_nudge case where A succeeded with a nudge but B/C still 503'd.
  const errs = aiFeedback.errors;
  const hasPromptErrors = Boolean(
    errs?.reflection ||
      errs?.scoring ||
      errs?.frameworkSuggestions ||
      status === "errored" ||
      status === "partial",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      className="dt-stagger mt-2 flex w-full flex-col gap-6 rounded-2xl border border-base-200 bg-base-100 p-5"
    >
      {/* TIER 0 — Try Again action, top-right corner. Single regenerate UI,
          always visible when retries remain (no hasPromptErrors gate, so users
          on a clean status='complete' run can also re-run). The in-banner
          inline button is removed below to avoid duplication. */}
      {retryButton && (
        <div className="flex items-center justify-end -mt-1 -mb-2">
          {retryButton}
        </div>
      )}

      {/* TIER 0 — Status banner. Subtle, top, doesn't compete with the H1. */}
      {hasPromptErrors && (
        <div className="dt-rise flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full bg-warning"
              aria-hidden="true"
            />
            <p className="text-[11px] leading-snug text-warning-content/80">
              {status === "needs_nudge"
                ? "Some growth sections unavailable — answer the nudge or retry."
                : "Some sections unavailable right now — showing what we could fetch."}
            </p>
          </div>
          {/* Try-again CTA moved to the top-right of the panel (above), so it's
              visible in every state — not just inside this error banner. */}
        </div>
      )}

      {/* TIER 0 — Nudge. Warning-toned card, distinct from the hero. */}
      {status === "needs_nudge" && nudge && (
        <div className="dt-rise flex flex-col gap-2 rounded-lg border-l-4 border-warning bg-warning/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-warning">
            One gentle nudge before you go
          </p>
          {nudge.nudgeMessages.map((m, i) => (
            <p key={i} className="text-sm leading-relaxed text-base-content/70">
              {m}
            </p>
          ))}
        </div>
      )}

      {/* TIER 1 — H1 HERO: APPRECIATION. SparklesIcon inline with the H2 —
          no separate TODAY kicker (the panel position already says "today"). */}
      {reflection?.appreciation && (
        <section className="dt-rise flex items-start gap-3 rounded-xl border-l-4 border-primary bg-primary/5 py-4 pl-5 pr-4">
          <span className="mt-0.5 text-primary"><SparklesIcon size="sm" /></span>
          <h2 className="text-xl font-bold leading-tight text-base-content">
            {reflection.appreciation}
          </h2>
        </section>
      )}

      {/* GROUNDING — the sources this feedback is anchored to (W2.1). Chips only;
          when empty the section is omitted (feedback says less, invents nothing). */}
      {grounding.length > 0 && (
        <section className="dt-rise flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/40">
            Grounded in
          </p>
          <div className="flex flex-wrap gap-1.5">
            {grounding.map((g, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-base-200 px-2.5 py-1 text-xs text-base-content/70"
              >
                <span className="font-medium">
                  {GROUNDING_LABEL[g.kind] ?? g.kind}
                </span>
                <span className="text-base-content/55">{g.label}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* HEROICS — when the report reads as firefighting, convert it to a filed
          constraint in one tap (W2.3). Each heroic act is an undiagnosed constraint. */}
      {aiFeedback.heroics && (
        <section className="dt-rise flex flex-col gap-2 rounded-lg border-l-4 border-warning bg-warning/5 px-4 py-3">
          <p className="text-sm font-medium text-base-content/85">
            {aiFeedback.heroics.prompt}
          </p>
          <p className="text-xs text-base-content/55">
            Each heroic act is often an undiagnosed constraint. File it in a tap.
          </p>
          <FileAsImprovementObject
            sourceType="daily_report"
            sourceId={reportId ?? undefined}
            defaultTitle={heroicsDefaultTitle(aiFeedback.heroics.categories)}
            description="Why did this require heroism?"
            cta="File this constraint"
          />
        </section>
      )}

      {/* ──────── TIER 2 — ACTIONS FOR TOMORROW ────────
          Frameworks are the primary call-to-action. Cards always visible
          (max 3) — strong-fit picks lead with primary border + dot. */}
      {hasTomorrowActions && (
        <section className="dt-rise flex flex-col gap-3">
          <TierLabel
            kicker="Try tomorrow"
            icon={<Target className="h-3.5 w-3.5" />}
            count={frameworkSuggestions.length}
          >
            Recommended frameworks
          </TierLabel>
          <FrameworkSuggestionsSection suggestions={frameworkSuggestions} />
        </section>
      )}

      {/* ──────── TIER 3 — GROWTH QUADRANT (2×2) ────────
          Per SSOT D Law 1: progressive disclosure. Each cell shows the
          TOP item + count; click to expand the rest inline. */}
      {(hasGrowthDirection || hasResources) && (
        <section className="dt-rise flex flex-col gap-3">
          <TierLabel kicker="Where to grow next">Growth quadrant</TierLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {growth.skills.length > 0 && (
              <QuadrantCell
                kicker="Learn"
                title="Skills"
                count={growth.skills.length}
                icon={<GraduationCap className="h-4 w-4" />}
                previewTitle={growth.skills[0].topic}
              >
                <SkillsList skills={growth.skills} />
              </QuadrantCell>
            )}
            {growth.habits.length > 0 && (
              <QuadrantCell
                kicker="Build"
                title="Habits"
                count={growth.habits.length}
                icon={<Repeat className="h-4 w-4" />}
                previewTitle={growth.habits[0].name}
                previewBadge={growth.habits[0].cadence}
              >
                <HabitsList habits={growth.habits} />
              </QuadrantCell>
            )}
            {growth.reading.length > 0 && (
              <QuadrantCell
                kicker="Study"
                title="Read · HBR"
                count={growth.reading.length}
                icon={<BookOpen className="h-4 w-4" />}
                previewTitle={growth.reading[0].title}
              >
                <ResourceList
                  items={growth.reading}
                  ctaLabel="Search HBR →"
                />
              </QuadrantCell>
            )}
            {growth.viewing.length > 0 && (
              <QuadrantCell
                kicker="Absorb"
                title="Watch · YouTube"
                count={growth.viewing.length}
                icon={<PlayCircle className="h-4 w-4" />}
                previewTitle={growth.viewing[0].title}
              >
                <ResourceList
                  items={growth.viewing}
                  ctaLabel="Search YouTube →"
                />
              </QuadrantCell>
            )}
          </div>
        </section>
      )}

      {/* ─────────────────── TIER 5 — DETAILED SIGNALS (collapsed) ───────── */}
      {hasDetailedSignals && (
        <section className="border-t border-base-200 pt-3">
          <button
            type="button"
            onClick={() => setShowSignals((v) => !v)}
            className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-base-content/45 transition-colors hover:text-base-content/70"
          >
            <span>Reflection signals & detailed notes</span>
            <span className="text-base">{showSignals ? "−" : "+"}</span>
          </button>

          {showSignals && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-3 flex flex-col gap-4"
            >
              {/* Specific suggestions on today's report */}
              {reflection?.suggestions && reflection.suggestions.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/40">
                    To build on today
                  </p>
                  <ul className="flex flex-col gap-1">
                    {reflection.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-base-content/65">
                        • {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rubric score — 4 axes of reflection quality */}
              {reflection?.rubricScore && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/40">
                    Reflection rubric
                  </p>
                  {RUBRIC_LABELS.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-base-content/60">
                        {label}
                      </span>
                      <ScoreDots value={reflection.rubricScore![key]} />
                    </div>
                  ))}
                </div>
              )}

              {/* P1–P4 scoring */}
              {scoring?.scores && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-base-content/40">
                    P1–P4 levels
                  </p>
                  {P_LABELS.map(({ key, label }) => {
                    const entry = scoring.scores?.[key];
                    if (!entry) return null;
                    return (
                      <div key={key} className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-base-content/60">
                            {label}
                          </span>
                          <span className="text-xs font-semibold text-primary">
                            Level {entry.level}
                          </span>
                        </div>
                        {entry.feedback && (
                          <p className="text-xs text-base-content/45">
                            {entry.feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </section>
      )}

      {/* Quota warning — bottom, soft, non-blocking */}
      {aiFeedback.quotaWarning && (
        <p className="text-[11px] text-warning/80">
          You&apos;re over your monthly AI token allowance — usage continues on
          your own provider key.
        </p>
      )}

    </motion.div>
  );
}

/**
 * Tier divider — single-line headline (icon + label + count chip). The
 * old two-line kicker + heading stack was twice the vertical space and
 * largely decorative; one line is enough to orient the eye.
 */
function TierLabel({
  children,
  icon,
  count,
}: {
  /** Kept for API compatibility with prior call sites — no longer rendered. */
  kicker?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-base-content/80">
        {icon}
        {children}
      </span>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full bg-base-200 px-2 py-0.5 text-[10px] font-semibold text-base-content/60">
          {count}
        </span>
      )}
    </div>
  );
}

/**
 * One cell of the Growth Quadrant 2×2 — SSOT D Pattern 2 (expandable data
 * row, scoped to a card). Always shows: verb kicker, icon, title, traffic-
 * light dot, count, and the TOP item. Click the header to reveal the rest.
 *
 * Precognitive signals (Law 3): icon + green/gray dot tell the user what
 * the cell is and whether it has content, before they read the title.
 */
function QuadrantCell({
  kicker: _kicker,
  title,
  count,
  icon,
  previewTitle,
  previewBadge,
  children,
}: {
  /** Kept for API compatibility — no longer rendered. */
  kicker?: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  /** The first item's headline — name/topic/title. No reason here. */
  previewTitle: string;
  /** Optional inline badge next to the preview title (e.g. habit cadence). */
  previewBadge?: string;
  /** Full list (including the previewed top item) rendered on expand. */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const hasMore = count > 0;

  return (
    <div className="dt-hover-lift flex h-full flex-col gap-1.5 rounded-lg border border-base-200 bg-base-200/40 p-2.5">
      <button
        type="button"
        onClick={() => hasMore && setOpen((v) => !v)}
        disabled={!hasMore}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/70">
          {icon}
          {title}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold text-base-content/55">
            {count}
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 text-base-content/40 transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Top-item title only — no reason. Click to see full list with reasons. */}
      <div className="flex items-baseline gap-1.5 text-sm leading-tight">
        <span className="truncate font-medium text-base-content/85">
          {previewTitle}
        </span>
        {previewBadge && (
          <span className="shrink-0 rounded-full bg-base-100 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-base-content/55">
            {previewBadge}
          </span>
        )}
      </div>

      {open && hasMore && (
        <div className="dt-fade-in mt-1 border-t border-base-200/80 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}

function SkillsList({ skills }: { skills: AiSkillSuggestion[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {skills.map((s, i) => (
        <li key={`${s.topic}-${i}`} className="text-sm">
          <span className="font-medium text-base-content/85">{s.topic}</span>
          {s.reason && (
            <span className="block text-xs text-base-content/55">
              {s.reason}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function HabitsList({ habits }: { habits: AiHabitSuggestion[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {habits.map((h, i) => (
        <li key={`${h.name}-${i}`} className="text-sm">
          <div className="flex items-start gap-1.5">
            <span className="font-medium text-base-content/85">{h.name}</span>
            <span className="mt-0.5 rounded-full bg-base-100 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-base-content/55">
              {h.cadence}
            </span>
          </div>
          {h.reason && (
            <span className="mt-0.5 block text-xs text-base-content/55">
              {h.reason}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function ResourceList({
  items,
  ctaLabel,
}: {
  items: AiResourceSuggestion[];
  ctaLabel: string;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((r, i) => (
        <li key={`${r.title}-${i}`}>
          <p className="text-sm font-medium text-base-content/85">{r.title}</p>
          {r.reason && (
            <p className="mt-0.5 text-xs text-base-content/55">{r.reason}</p>
          )}
          {r.searchUrl && (
            <a
              href={r.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
            >
              {ctaLabel}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Framework recommendation cards — primary action items for tomorrow.
 *
 * Layout: 3-column grid on lg+ (3 cards fit perfectly with our 3-item max
 * from the prompt), 2-col on md, 1-col on sm. Cards stay equal-weight so
 * the eye can scan all three at once.
 *
 * Precognitive signals (SSOT D Law 3): strong-fit picks get a 4px primary
 * border-left + filled green dot; worth-trying picks get a thinner muted
 * border + outlined dot. The user reads "what to try" before they read text.
 */
function FrameworkSuggestionsSection({
  suggestions,
}: {
  suggestions: AiFrameworkSuggestion[];
}) {
  const [openId, setOpenId] = useState<AiFrameworkSuggestion["id"] | null>(null);
  return (
    <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
      {suggestions.map((s) => {
        const isStrong = s.fit === "strong";
        const isOpen = openId === s.id;
        const hasReason = Boolean(s.reason);
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => hasReason && setOpenId(isOpen ? null : s.id)}
              disabled={!hasReason}
              className={cn(
                "dt-hover-lift flex w-full flex-col gap-2 rounded-lg border p-2.5 text-left transition-shadow",
                isStrong
                  ? "border-l-4 border-primary/40 border-l-primary bg-primary/5"
                  : "border-base-200 bg-base-100",
                hasReason && "cursor-pointer",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      isStrong
                        ? "bg-success"
                        : "border border-base-content/30 bg-transparent",
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "truncate text-sm font-semibold leading-tight",
                      isStrong ? "text-primary" : "text-base-content",
                    )}
                  >
                    {s.name}
                  </span>
                </div>
                {hasReason && (
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 shrink-0 text-base-content/40 transition-transform duration-150",
                      isOpen && "rotate-180",
                    )}
                  />
                )}
              </div>
              {isOpen && s.reason && (
                <p className="dt-fade-in pl-3.5 text-xs leading-relaxed text-base-content/65">
                  {s.reason}
                </p>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
