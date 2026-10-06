"use client";

import React, { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  BookOpen,
  Brain,
  Clock,
  Eye,
  FlaskConical,
  Hammer,
  MessageSquare,
  Play,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { cn } from "@/utils";
import { iconSizes } from "@/utils/shared/design.utils";
import {
  KIND_LABEL,
  isChallenge,
  type ChallengeMode,
  type LearningSuggestion,
} from "@/types/aavahana/learning.types";
import {
  LearningContentModal,
  youtubeVideoId,
} from "./LearningContentModal";

/**
 * The suggestion, as something worth looking at.
 *
 * WHAT WAS WRONG BEFORE
 * It sat last in the right-hand sidebar of the summary, under "Friction" and
 * "Before you go", in the same small grey type as everything else. It was the
 * least noticeable thing on the screen, and nothing about it said why anybody
 * should care.
 *
 * WHAT ACTUALLY MAKES SOMEBODY OPEN IT
 * Four things, in this order, and the order is the design:
 *
 *  1. WHY IT IS FOR THEM. "You hit the same handover queue three days running"
 *     is the sentence that earns the next four seconds. A category label like
 *     "Read" earns nothing, so the reason goes first and the label goes last.
 *  2. HOW SMALL IT IS. The single biggest reason people ignore a recommendation
 *     is the suspicion that it will cost an hour. "5 min" answers that before
 *     they have to wonder, so it is set large and next to the title.
 *  3. THAT IT IS REAL. A confirmed author and year, from Open Library or
 *     YouTube, is the difference between a recommendation and an assertion.
 *  4. THAT SOMEBODY ELSE USED IT. "Two people found this useful" is the most
 *     persuasive sentence available and it costs nothing, because the catalogue
 *     already counts it.
 *
 * Nothing is behind a click. The old panel hid twelve items behind a chevron and
 * nobody ever pressed it.
 */

interface SuggestionCardProps {
  suggestion: LearningSuggestion;
  /** Rendered underneath: the "did you apply it" controls, or nothing. */
  children?: React.ReactNode;
  className?: string;
}

export function SuggestionCard({
  suggestion,
  children,
  className,
}: SuggestionCardProps) {
  const [contentOpen, setContentOpen] = useState(false);
  const closeContent = useCallback(() => setContentOpen(false), []);
  const {
    title,
    reason,
    sourceNote,
    effortMins,
    searchUrl,
    kind,
    verified,
    sourceTitle,
    author,
    year,
    provenCount,
    mode,
    modeLabel,
    acceptedAt,
  } = suggestion;

  // Only worth saying once more than one person has proved it. "1 person found
  // this useful" reads as thin, which is worse than saying nothing.
  const social = provenCount != null && provenCount > 1 ? provenCount : null;

  // A reading or video opens inside Aavahana. A framework, skill or habit has
  // no source to view, so its first step is promoted into the body instead.
  const hasLink = Boolean(searchUrl);
  const hasVerifiedVideo =
    kind === "viewing" && verified && Boolean(youtubeVideoId(searchUrl));
  // A challenge is something to do; reading and viewing are material.
  const challenge = isChallenge(kind);
  const hasLearningContent =
    kind === "reading" || hasVerifiedVideo || Boolean(suggestion.expansion);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.07] via-base-100 to-base-100 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        {/* 0. What kind of thing today is asking for.
            Only on a challenge. The point of this line is variety, not
            information: somebody who sees "Observe" on Tuesday after "Apply" on
            Monday knows the day is not the same as yesterday before reading a
            word of it. That is what keeps a daily habit from going stale.

            An article gets no mode label. It already says "Read" at the bottom,
            and stacking "Discover" on top of that is two labels saying one
            thing. */}
        {challenge && (mode || acceptedAt) && (
          <div className="flex items-center gap-2">
            <ModeBadge mode={mode} label={modeLabel} />
            {acceptedAt && (
              <span className="text-xs font-medium text-success">
                You said you will do this
              </span>
            )}
          </div>
        )}

        {/* 1. Why this, for you. The sentence that earns the next four seconds. */}
        {reason && (
          <p className="text-sm leading-relaxed text-base-content/70">{reason}</p>
        )}

        {/* 2. The idea, and what it costs, together. */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-xl font-semibold leading-tight tracking-tight text-base-content sm:text-2xl">
            {title}
          </h3>
          {effortMins != null && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/12 px-2.5 py-1 text-sm font-semibold text-primary">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {effortMins} min
            </span>
          )}
        </div>

        {/* 3 and 4. What to actually do, that it is real, and who else used it.
            For a book or a video the source note says where to find it. For a
            framework, a skill or a habit there is nothing to open, so the note
            IS the suggestion: one concrete thing to do tomorrow. A framework
            name on its own ("PDCA") is a word nobody can act on, which was the
            whole problem with the panel this replaced. */}
        <div className="flex flex-col gap-1.5">
          {sourceNote &&
            (hasLink ? (
              <p className="text-sm text-base-content/60">{sourceNote}</p>
            ) : (
              <div className="rounded-lg border border-primary/20 bg-base-100/70 px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/70">
                  Try this tomorrow
                </p>
                <p className="mt-1 text-sm leading-relaxed text-base-content/85">
                  {sourceNote}
                </p>
              </div>
            ))}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/50">
            {verified && (
              <span className="inline-flex min-w-0 items-center gap-1 text-success">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                <span className="line-clamp-1">
                  {[sourceTitle, author, year].filter(Boolean).join(" · ") ||
                    "Source confirmed"}
                </span>
              </span>
            )}
            {social && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {social} people found this useful
              </span>
            )}
            <span className="uppercase tracking-[0.12em]">{KIND_LABEL[kind]}</span>
          </div>
        </div>

        {/* Keep the person in Aavahana. The original source remains available
            inside the viewer, but it is no longer the primary action. */}
        {hasLearningContent && (
          <Button
            type="button"
            size="sm"
            className="mt-1 w-fit"
            onClick={() => setContentOpen(true)}
            iconBefore={
              hasVerifiedVideo ? (
                <Play className={iconSizes.sm} aria-hidden />
              ) : (
                <BookOpen className={iconSizes.sm} aria-hidden />
              )
            }
          >
            {hasVerifiedVideo ? "Watch here" : "Read here"}
          </Button>
        )}

        {kind === "viewing" && !hasVerifiedVideo && (
          <p className="text-sm leading-relaxed text-base-content/60">
            Aavahana could not confirm a playable version of this video, so it
            has not opened an uncertain search result.
          </p>
        )}

        {children}
      </div>

      {hasLearningContent && (
        <LearningContentModal
          isOpen={contentOpen}
          suggestion={suggestion}
          onClose={closeContent}
        />
      )}
    </motion.div>
  );
}

/**
 * The one place a challenge mode is drawn.
 *
 * An icon here rather than plain text because six modes rotating day to day is
 * exactly the case an icon is for: it is recognised before it is read, so the
 * difference between today and yesterday registers without anybody parsing a
 * word. Everywhere else in this report the chips are plain text, because there
 * the label IS the content.
 */
const MODE_ICON: Record<ChallengeMode, React.ComponentType<{ className?: string }>> = {
  apply: Hammer,
  think: Brain,
  discover: Search,
  communicate: MessageSquare,
  experiment: FlaskConical,
  observe: Eye,
};

function ModeBadge({
  mode,
  label,
}: {
  mode: ChallengeMode | null;
  label: string | null;
}) {
  // Suggestions issued before modes existed carry none. They still read fine
  // without the line, so nothing is invented to fill the gap.
  if (!mode || !label) return null;
  const Icon = MODE_ICON[mode];

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-base-content/[0.06] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-base-content/60">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
