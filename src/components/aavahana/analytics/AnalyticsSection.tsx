'use client';

import { cn } from '@/utils';
import { AlertCircleIcon } from '@/components/shared/icons';
import { Badge } from '@/components/shared/Badge';
import { useWeeklyReportV4 } from '@/lib/hooks/aavahana/use-weekly-report-v4';
import { formatDate } from '@/utils/shared/date.utils';
import type { TimesheetCategory } from '@/types/aavahana/pdgms.types';
import {
  CATEGORY_LABELS,
  CATEGORY_BG,
  detectStructuralProblems,
} from './analytics.constants';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TrendWeek {
  weekStart: string;
  snapshot: { totalHours: number; categories: TimesheetCategory[] } | null;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AnalyticsSectionProps {
  /** When embedded in weekly report, pass snapshot directly */
  snapshot?: { totalHours: number; categories: TimesheetCategory[] } | null;
  /** When standalone, fetch via weekStart */
  weekStart?: string;
  mode: 'embedded' | 'standalone' | 'trend';
  /** For trend mode: pre-fetched weekly snapshots (oldest → newest) */
  trendWeeks?: TrendWeek[];
  trendLoading?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AnalyticsSection({ snapshot, weekStart, mode, trendWeeks, trendLoading }: AnalyticsSectionProps) {
  // In standalone mode, fetch the V4 report to get analyticsSnapshot
  const v4 = useWeeklyReportV4(mode !== 'trend' ? (weekStart ?? '') : '');
  const enabled = mode === 'standalone';

  const data = mode === 'embedded'
    ? snapshot
    : v4.report?.analyticsSnapshot ?? null;

  // Trend mode — renders multi-week bars, ignores standalone/embedded logic
  if (mode === 'trend') {
    if (trendLoading) {
      return <div className="py-8 text-center text-sm text-neutral">Loading trend…</div>;
    }
    if (!trendWeeks?.length) {
      return (
        <div className="py-8 text-center text-sm text-neutral">
          No trend data available. Submit weekly reports to see patterns.
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {trendWeeks.map((week) => {
          const snap = week.snapshot;
          const hasData = !!snap && snap.totalHours > 0;
          return (
            <div key={week.weekStart} className="flex items-center gap-3">
              <span className="text-xs text-neutral w-14 shrink-0">
                {formatDate(week.weekStart, 'MMM D')}
              </span>
              <div className="flex-1 flex h-4 rounded-full overflow-hidden bg-base-300">
                {hasData && snap.categories.map((cat) => {
                  const pct = (cat.hours / snap.totalHours) * 100;
                  if (pct < 1) return null;
                  return (
                    <div
                      key={cat.category}
                      className={cn('h-full', CATEGORY_BG[cat.category])}
                      style={{ width: `${pct}%` }}
                      title={`${CATEGORY_LABELS[cat.category]}: ${cat.hours}h`}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-neutral w-10 text-right shrink-0">
                {hasData ? `${snap.totalHours}h` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (enabled && v4.isLoading) {
    return (
      <div className="py-8 text-center text-sm text-neutral">Loading analytics…</div>
    );
  }

  if (!data || data.categories.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-neutral">
        No time data available yet. Submit daily reports to populate analytics.
      </div>
    );
  }

  const { totalHours, categories } = data;
  const problems = detectStructuralProblems(categories);

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="flex h-6 rounded-full overflow-hidden bg-base-300">
        {categories.map((cat) => {
          const pct = totalHours > 0 ? (cat.hours / totalHours) * 100 : 0;
          if (pct < 1) return null;
          return (
            <div
              key={cat.category}
              className={cn('h-full', CATEGORY_BG[cat.category])}
              style={{ width: `${pct}%` }}
              title={`${CATEGORY_LABELS[cat.category]}: ${cat.hours}h (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      {/* Category list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map((cat) => {
          const pct = totalHours > 0 ? Math.round((cat.hours / totalHours) * 100) : 0;
          return (
            <div key={cat.category} className="flex items-center gap-2">
              <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', CATEGORY_BG[cat.category])} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-base-content truncate">
                  {CATEGORY_LABELS[cat.category]}
                </p>
                <p className="text-xs text-neutral">
                  {cat.hours}h · {pct}%
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <p className="text-xs text-neutral text-right">{totalHours}h total logged</p>

      {/* Structural problems (A9) */}
      {problems.length > 0 && (
        <div className="space-y-1.5">
          {problems.map((problem, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg bg-error/5 border border-error/10 px-3 py-2"
            >
              <AlertCircleIcon size="xs" className="text-error mt-0.5 shrink-0" />
              <p className="text-xs text-error">{problem}</p>
            </div>
          ))}
        </div>
      )}

      {/* Standalone mode: wrap in section */}
      {mode === 'standalone' && v4.report && (
        <div className="pt-4 border-t border-base-300">
          <p className="text-xs text-neutral">
            Week: {v4.report.weekStart} — {v4.report.weekEnd}
            {v4.report.status !== 'draft' && (
              <Badge variant="success" size="sm" label={v4.report.status} className="ml-2" />
            )}
          </p>
        </div>
      )}
    </div>
  );
}
