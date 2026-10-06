"use client";

import Link from "next/link";
import { useUBS, useUBSConfig } from "@/lib/hooks/aavahana/use-ubs";
import { UBSWidget } from "@/components/aavahana/ubs/UBSWidget";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/shared/Badge";
import { cn } from "@/utils";
import { formatDate } from "@/utils/shared/date.utils";
import {
  EVENT_PURPOSE,
  getMilestoneMessage,
  type EventPurpose,
} from "@/components/aavahana/ubs/ubs.constants";
import type { UBSEvent, UBSConfigItem } from "@/types";

// ─── Recognition Signal (effective config, individual tier) ──────────────────

function RecognitionSignal({ config }: { config: UBSConfigItem[] }) {
  if (config.length === 0) return null;
  // Active weights first, forward (weight 0) keys last.
  const ordered = [...config].sort((a, b) => b.weight - a.weight);
  return (
    <section className="card bg-base-100 border border-base-300">
      <div className="card-body">
        <h2 className="card-title text-lg mb-1">How your drills are recognized</h2>
        <p className="text-sm dt-text-muted mb-3">
          These are the behaviors your week is scored on. This is the earliest
          signal DeepThought reads, before any review or pressure.
        </p>
        <ul className="space-y-2">
          {ordered.map((item) => {
            const isForward = item.weight <= 0;
            return (
              <li
                key={item.eventType}
                className="flex items-center justify-between gap-3"
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    isForward ? "dt-text-muted" : "text-base-content"
                  )}
                >
                  {item.eventLabel}
                </span>
                {isForward ? (
                  <Badge label="activates soon" variant="info" size="sm" />
                ) : (
                  <span className="text-xs font-semibold text-primary flex-shrink-0">
                    weight {item.weight}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ─── Drill Card ──────────────────────────────────────────────────────────────

function DrillCard({
  event,
  purpose,
}: {
  event: UBSEvent;
  purpose: EventPurpose | undefined;
}) {
  const done = event.participated;
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl border",
        done
          ? "bg-success/5 border-success/20"
          : "bg-base-100 border-base-300"
      )}
    >
      <span
        className={cn(
          "text-lg mt-0.5 flex-shrink-0",
          done ? "text-success" : "text-base-300"
        )}
      >
        {done ? "✓" : "○"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <p
            className={cn(
              "font-semibold text-sm",
              done ? "text-base-content" : "dt-text-muted"
            )}
          >
            {event.eventLabel}
          </p>
          <span
            className={cn(
              "text-xs font-bold flex-shrink-0",
              done ? "text-success" : "dt-text-muted"
            )}
          >
            +{event.weight} pts
          </span>
        </div>
        <p className="text-xs dt-text-muted mt-0.5">
          {done ? purpose?.done : purpose?.pending}
        </p>
        {!done && purpose?.link && (
          <Link
            href={purpose.link}
            className="text-xs text-primary font-semibold mt-1 inline-block hover:underline"
          >
            → {purpose.pending}
          </Link>
        )}
        {done && event.timestamp && (
          <p className="text-xs opacity-40 mt-0.5">
            {formatDate(event.timestamp, "displayDate")}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function UBSPage() {
  const {
    currentScore,
    trend,
    percentage,
    consecutiveWeeks,
    isLoading,
    error,
    refresh,
  } = useUBS();
  const { config } = useUBSConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={refresh}>
          Retry
        </button>
      </div>
    );
  }

  // Split events: completed first, then pending
  const completed = (currentScore?.breakdown ?? []).filter((e) => e.participated);
  const pending = (currentScore?.breakdown ?? []).filter((e) => !e.participated);
  const orderedEvents = [...completed, ...pending];

  // This week vs last week
  const sortedWeeks = trend
    ? [...trend.weeks].sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    : [];
  const thisWeekScore = sortedWeeks[0]?.score ?? null;
  const lastWeekScore = sortedWeeks[1]?.score ?? null;
  const weekDelta =
    thisWeekScore !== null && lastWeekScore !== null
      ? thisWeekScore - lastWeekScore
      : null;

  const milestoneMessage = getMilestoneMessage(consecutiveWeeks);

  const maxBarHeight = 80;
  const maxScore =
    trend?.weeks.reduce((m, w) => Math.max(m, w.score ?? 0), 1) ?? 1;

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader
        title="Your Drills"
        subtitle="Every drill you complete builds a habit. Every habit builds capability. The points get you started — the value keeps you going."
      />

      <div className="space-y-6">
        {/* UBS Widget */}
        {currentScore && (
          <UBSWidget
            score={currentScore.score}
            maxPossible={currentScore.maxPossible}
            percentage={percentage}
            consecutiveWeeks={consecutiveWeeks}
            trend={trend?.weeks}
            showLink={false}
            configSource={currentScore.configSource}
            miniGroupName={currentScore.miniGroupName}
          />
        )}

        {/* Recognition signal — effective config, individual tier */}
        <RecognitionSignal config={config} />

        {/* Streak milestone banner (standalone if no widget streak shown) */}
        {consecutiveWeeks >= 1 && milestoneMessage && (
          <div className="alert bg-warning/10 border border-warning/30 text-sm">
            <span className="text-warning text-base">🔥</span>
            <span className="text-base-content italic">&ldquo;{milestoneMessage}&rdquo;</span>
          </div>
        )}

        {/* This week vs last week */}
        {weekDelta !== null && (
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body py-3 px-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="font-semibold">
                  This Week:{" "}
                  <span className="text-primary">{thisWeekScore} pts</span>
                </span>
                <span className="opacity-60">
                  Last Week: {lastWeekScore} pts
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    weekDelta > 0 ? "text-success" : "dt-text-muted"
                  )}
                >
                  {weekDelta > 0
                    ? `↑ +${weekDelta} pts — building momentum`
                    : weekDelta === 0
                    ? "→ Holding steady"
                    : "Try one more drill this week to get back on track"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Drill Cards */}
        {orderedEvents.length > 0 && (
          <section className="card bg-base-100 border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-lg mb-3">This Week&apos;s Drills</h2>
              <div className="space-y-2">
                {orderedEvents.map((event, idx) => (
                  <DrillCard
                    key={idx}
                    event={event}
                    purpose={EVENT_PURPOSE[event.eventType]}
                  />
                ))}
              </div>
              {pending.length === 0 && (
                <p className="text-sm text-success font-semibold mt-3 text-center">
                  🎉 Every drill completed this week — perfect score!
                </p>
              )}
            </div>
          </section>
        )}

        {/* Score Trend */}
        {trend && trend.weeks.length > 0 && (
          <section className="card bg-base-100 border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">Score Trend</h2>
              <div className="flex items-end gap-2 h-24">
                {trend.weeks.map((week) => {
                  const heightPct =
                    maxScore > 0
                      ? ((week.score ?? 0) / maxScore) * maxBarHeight
                      : 0;
                  const isCurrent = week.weekStart === sortedWeeks[0]?.weekStart;
                  return (
                    <div
                      key={week.weekStart}
                      className="flex flex-col items-center gap-1 flex-1 min-w-0"
                    >
                      <span className="text-xs font-semibold opacity-70">
                        {week.score}
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-t-md transition-all",
                          isCurrent ? "bg-primary" : "bg-base-300"
                        )}
                        style={{ height: `${heightPct}px` }}
                        title={`${week.weekStart}: ${week.score}`}
                      />
                      <span className="text-[10px] opacity-50 truncate w-full text-center">
                        {week.weekStart.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

