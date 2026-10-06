import React from "react";
import { cn } from "@/utils";
import { OverlayLoading } from "@/components/shared/OverlayLoading";
import { EmptyState } from "@/components/shared/EmptyState";
import type { FeedbackAggregate } from "@/types/shared/feedback.types";

interface AggregateViewProps {
  aggregate: FeedbackAggregate | null | undefined;
  isLoading: boolean;
  error?: Error | null;
  label?: string;
  className?: string;
}

function getDimensionInsight(avg: number): string {
  if (avg >= 8) return "Strength — your team consistently sees this";
  if (avg >= 6) return "Solid ground — reliable, room to sharpen";
  if (avg >= 4) return "Stretch zone — your team sees growth potential here";
  return "Growth area — consider asking your team what would help";
}

function getCoachingNudge(composite: number): string {
  if (composite >= 8) {
    return "Your team sees consistent strength. The risk at this level is complacency — ask what one thing could make the experience even better.";
  }
  if (composite >= 6) {
    return "Solid foundation. Your team sees you clearly — strengths and stretch zones both. Pick one stretch zone and try a small experiment next period. One thing, not everything.";
  }
  if (composite >= 4) {
    return "Your team is telling you something worth hearing. This isn't a verdict — it's a signal. Pick the dimension closest to your daily work and ask one team member: \"What would help?\" You don't have to fix everything. Start with one thing.";
  }
  return "This score means your team needs something different from you. That's uncomfortable to read — and it took courage for them to say it anonymously. The most useful thing you can do is pick one dimension and have an honest conversation with someone you trust about what's happening. Not to defend — to understand.";
}

function getTrendText(trend: FeedbackAggregate["trend"]): string | null {
  if (!Array.isArray(trend) || trend.length < 2) return null;
  const last = trend[trend.length - 1].compositeAvg;
  const prev = trend[trend.length - 2].compositeAvg;
  if (last > prev + 0.3) return "Your team is seeing progress — keep going";
  if (last < prev - 0.3) return "Something shifted this period. That's useful to know — not to judge yourself, but to investigate.";
  return "Consistent — your team's experience of you is steady";
}

export function AggregateView({ aggregate, isLoading, error, label = "How Your Team Sees You", className }: AggregateViewProps) {
  if (isLoading) {
    return (
      <div className="relative min-h-[200px] flex items-center justify-center">
        <OverlayLoading title="Loading…" size="sm" />
      </div>
    );
  }

  if (error || !aggregate || aggregate.compositeAvg == null) {
    return (
      <EmptyState
        title="No reflections received yet for this period"
        subtitle="Once enough responses come in, you'll see patterns here — never individual inputs."
      />
    );
  }

  const dimensionAvgs = aggregate.dimensionAvgs ?? [];
  const maxAvg = Math.max(...dimensionAvgs.map((d) => d.avg ?? 0), 10);
  const MIN_RESPONDENTS = 3;
  const hasEnoughResponses = aggregate.respondentCount >= MIN_RESPONDENTS;
  const trendText = getTrendText(aggregate.trend);
  const periodLabel = aggregate.period ? `· ${aggregate.period}` : "";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Framing + composite */}
      <div className="bg-base-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-black">{label}</p>
        <p className="text-sm text-[var(--dt-textDim)]">
          This reflects your team&apos;s collective experience of working with you this period.
          It&apos;s a signal, not a verdict — look for where you&apos;re strong and where you could stretch.
        </p>
        <p className="text-base text-black">
          <span className="text-2xl font-bold">{Number(aggregate.compositeAvg).toFixed(1)}</span>
          <span className="text-sm text-[var(--dt-textDim)] ml-2">
            {aggregate.respondentCount} response{aggregate.respondentCount !== 1 ? "s" : ""} {periodLabel}
          </span>
        </p>
      </div>

      {/* Dimension breakdown — only if ≥3 respondents */}
      {hasEnoughResponses && dimensionAvgs.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold dt-text-muted uppercase tracking-wider">Your Strength &amp; Stretch Zones</p>
          {dimensionAvgs.map((d) => {
            const pct = Math.round((d.avg / maxAvg) * 100);
            const insight = getDimensionInsight(d.avg);
            return (
              <div key={d.dimensionId} className="space-y-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="dt-text-muted">{d.dimensionName}</span>
                  <span className="font-semibold text-black">{d.avg != null ? Number(d.avg).toFixed(1) : "—"}</span>
                </div>
                <div className="h-2 bg-base-300 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--dt-textDim)]">{insight}</p>
                {d.observations && d.observations.length > 0 && (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-[var(--dt-textDim)] font-medium">What your team observed:</p>
                    <ul className="space-y-0.5">
                      {d.observations.map((obs, i) => (
                        <li key={i} className="text-xs text-black pl-3 before:content-['•'] before:absolute before:-ml-3 relative">{obs}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!hasEnoughResponses && (
        <p className="text-xs text-[var(--dt-textDim)] bg-base-200 rounded-xl px-4 py-3">
          Reflections are being collected. Dimension-level patterns appear once 3+ responses are in — this protects individual voice from being identifiable.
        </p>
      )}

      {/* Coaching nudge */}
      {hasEnoughResponses && (
        <div className="bg-base-200 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-black">What You Can Do</p>
          <p className="text-xs text-[var(--dt-textDim)]">{getCoachingNudge(aggregate.compositeAvg)}</p>
        </div>
      )}

      {/* Trend */}
      {Array.isArray(aggregate.trend) && aggregate.trend.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold dt-text-muted uppercase tracking-wider">Direction Over Time</p>
          <div className="flex items-end gap-2 h-10">
            {aggregate.trend.map((t) => {
              const h = Math.max(8, Math.round((t.compositeAvg / 10) * 40));
              return (
                <div key={t.period} className="flex flex-col items-center gap-0.5 flex-1" title={`${t.period}: ${t.compositeAvg}`}>
                  <div className="w-full rounded-sm bg-primary/60" style={{ height: h }} />
                  <span className="text-[10px] text-[var(--dt-textDim)] truncate w-full text-center">{t.period}</span>
                </div>
              );
            })}
          </div>
          {trendText && (
            <p className="text-xs text-[var(--dt-textDim)]">{trendText}</p>
          )}
        </div>
      )}
    </div>
  );
}
