"use client";

import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { cn } from "@/utils";
import { getMilestoneMessage } from "./ubs.constants";

interface UBSWidgetProps {
  score: number;
  maxPossible: number;
  percentage: number;
  consecutiveWeeks?: number;
  trend?: Array<{ weekStart: string; score: number | null }>;
  showLink?: boolean;
  configSource?: "miniGroup" | "org" | "dt";
  miniGroupName?: string;
}

function configSourceLabel(source?: string, groupName?: string): string | null {
  if (!source) return null;
  if (source === "miniGroup") return groupName ? `Scored via: ${groupName}` : "Group config";
  if (source === "org") return "Org defaults";
  return "DT defaults";
}

export function UBSWidget({
  score,
  maxPossible,
  percentage,
  consecutiveWeeks = 0,
  trend,
  showLink = true,
  configSource,
  miniGroupName,
}: UBSWidgetProps) {
  const isPerfect = percentage >= 100;
  const isStrong = percentage >= 75;
  const milestoneMessage = getMilestoneMessage(consecutiveWeeks);

  const barColor = isPerfect
    ? "bg-warning"
    : isStrong
    ? "bg-success"
    : "bg-primary";

  const statusLabel = isPerfect
    ? "Perfect week — every drill completed"
    : isStrong
    ? "Strong week — keep the momentum"
    : `${maxPossible - score} more points available this week`;

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body gap-4">
        {/* Score + streak row */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <p className="text-xs opacity-60 uppercase tracking-wide">This Week</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-primary leading-none">
                {score}
              </span>
              <span className="text-lg opacity-50 mb-1">/ {maxPossible} pts</span>
            </div>
          </div>

          {consecutiveWeeks > 0 && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-bold text-warning">
                🔥 {consecutiveWeeks}-week streak
              </span>
              {milestoneMessage && (
                <p className="text-xs dt-text-muted text-right max-w-xs italic">
                  &ldquo;{milestoneMessage}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div
          className="space-y-1.5"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="flex justify-between text-xs font-semibold opacity-60">
            <span>0</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
          <div className="w-full h-3 bg-base-300 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className={cn("text-xs font-medium", isPerfect ? "text-warning" : "dt-text-muted")}>
              {statusLabel}
            </p>
            {configSourceLabel(configSource, miniGroupName) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-base-200 text-base-content/60">
                {configSourceLabel(configSource, miniGroupName)}
              </span>
            )}
          </div>
        </div>

        {/* Mini sparkline */}
        {trend && trend.length > 0 && (
          <div className="flex flex-col gap-1 pt-1 border-t border-base-200">
            <p className="text-xs opacity-60">Last {Math.min(trend.length, 8)} weeks</p>
            <div className="flex items-end gap-1 h-8">
              {trend.slice(-8).map((week) => {
                const maxBarScore = trend.reduce(
                  (m, w) => Math.max(m, w.score ?? 0),
                  1
                );
                const h = Math.max(
                  4,
                  Math.round(((week.score ?? 0) / maxBarScore) * 32)
                );
                const isCurrent = week.score === score;
                return (
                  <div
                    key={week.weekStart}
                    className={cn(
                      "flex-1 rounded-t transition-all",
                      isCurrent ? "bg-primary" : "bg-base-300"
                    )}
                    style={{ height: `${h}px` }}
                    title={`${week.weekStart}: ${week.score}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* View Details link */}
        {showLink && (
          <div className="card-actions justify-end">
            <Link href="/aavahana/engagement-score">
              <Button variant="ghost" size="sm">
                View Drills &rarr;
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

