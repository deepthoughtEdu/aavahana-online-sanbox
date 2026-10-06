"use client";

import { motion } from "framer-motion";
import { useMyProgress } from "@/lib/hooks/hcd/use-progress";
import { StreakFlame } from "@/components/hcd/StreakFlame";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function dayLabel(dateKey: string): string {
  // dateKey is YYYY-MM-DD (local). Index into a fixed S–S label set by weekday.
  const d = new Date(`${dateKey}T00:00:00`);
  return DAY_LABELS[d.getDay()] ?? "";
}

/**
 * Compact progression strip shown at the top of HCD. Reads a server-computed,
 * pure-arithmetic streak (any meaningful action keeps it alive) plus a 7-day
 * activity strip and headline totals. Gives a reason to return without
 * inventing any score — every number is a real, recorded action.
 */
export function ProgressStrip() {
  const { data, isLoading } = useMyProgress();

  if (isLoading) {
    return (
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-4 flex-row items-center gap-3">
          <span className="loading loading-spinner loading-sm" />
          <span className="text-sm dt-text-dim">Loading your progress…</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { streak, week, totals, activeDays } = data;
  const alive = streak.current > 0;

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Streak */}
          <div className="flex items-center gap-3">
            <StreakFlame alive={alive} intensity={streak.current} />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums">{streak.current}</span>
                <span className="text-sm dt-text-dim">
                  day{streak.current === 1 ? "" : "s"} streak
                </span>
              </div>
              <p className="text-xs dt-text-dim">
                {alive
                  ? "Keep it alive — any drill, assessment, or idea today counts."
                  : "Do one thing today to start a streak."}
                {streak.longest > streak.current && (
                  <> · Best: {streak.longest}</>
                )}
              </p>
            </div>
          </div>

          {/* Headline totals */}
          <div className="flex items-center gap-5">
            <Stat value={totals.assessmentsCompleted} label="Assessed" />
            <Stat value={totals.drillsCompleted} label="Drills" />
            <Stat value={totals.initiativesVerified} label="Verified" />
            <Stat value={activeDays} label="Active days" />
          </div>
        </div>

        {/* Your week */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs dt-text-dim mr-1">This week</span>
          {week.map((d, i) => (
            <motion.div
              key={d.date}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: i * 0.02 }}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                d.active
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 dt-text-dim"
              }`}
              title={d.date}
            >
              {dayLabel(d.date)}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold tabular-nums leading-none">{value}</div>
      <div className="text-[0.65rem] dt-text-dim uppercase tracking-wide mt-0.5">
        {label}
      </div>
    </div>
  );
}
