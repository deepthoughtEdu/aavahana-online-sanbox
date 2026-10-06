'use client';

import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { ListCheckIcon, LightbulbIcon } from '@/components/shared/icons';
import type { DeliverableSummary, IPSummary, WeeklySummaryCard } from '@/types';

interface ContributionsSummaryProps {
  // The API has been observed to omit any of these fields when the month has no
  // data, so accept them as optional and fall back to safe defaults at the top
  // of the component instead of crashing on `.length`/`.map`.
  deliverables?: DeliverableSummary;
  ip?: IPSummary;
  weeklySummaries?: WeeklySummaryCard[];
  carryoverTrend?: number[];
}

const EMPTY_DELIVERABLES: DeliverableSummary = {
  completed: 0,
  inProgress: 0,
  total: 0,
} as DeliverableSummary;

const EMPTY_IP: IPSummary = {
  totalCommits: 0,
  targetCommits: 0,
  items: [],
} as IPSummary;

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <progress className="progress progress-primary w-full" value={value} max={max} />
      <span className="text-sm font-medium whitespace-nowrap">{pct}%</span>
    </div>
  );
}

export function ContributionsSummary({
  deliverables: deliverablesProp,
  ip: ipProp,
  weeklySummaries: weeklySummariesProp,
  carryoverTrend,
}: ContributionsSummaryProps) {
  const deliverables = deliverablesProp ?? EMPTY_DELIVERABLES;
  const ip = ipProp ?? EMPTY_IP;
  const weeklySummaries = weeklySummariesProp ?? [];
  const ipItems = ip.items ?? [];
  const completionPct = deliverables.total > 0 ? Math.round((deliverables.completed / deliverables.total) * 100) : 0;

  return (
    <>
      <Section>
        <Section.Header icon={<ListCheckIcon size="md" />} title="Deliverables" />
        <Section.Body>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="stat bg-base-200 rounded-btn p-3 flex-1 min-w-[120px]">
              <div className="stat-title text-xs">Delivered</div>
              <div className="stat-value text-lg">{deliverables.completed}</div>
            </div>
            <div className="stat bg-base-200 rounded-btn p-3 flex-1 min-w-[120px]">
              <div className="stat-title text-xs">In Progress</div>
              <div className="stat-value text-lg">{deliverables.inProgress}</div>
            </div>
            <div className="stat bg-base-200 rounded-btn p-3 flex-1 min-w-[120px]">
              <div className="stat-title text-xs">Total</div>
              <div className="stat-value text-lg">{deliverables.total}</div>
            </div>
            <div className="stat bg-base-200 rounded-btn p-3 flex-1 min-w-[120px]">
              <div className="stat-title text-xs">Completion</div>
              <div className="stat-value text-lg">{completionPct}%</div>
            </div>
          </div>

          <ProgressBar value={deliverables.completed} max={deliverables.total} />

          {weeklySummaries.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-base-content/60 mb-2">Week-over-week delivery</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {weeklySummaries.map((w) => (
                  <div key={w.weekStart} className="bg-base-200 rounded-btn p-2 text-center">
                    <p className="text-[10px] text-base-content/50">
                      {new Date(w.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm font-semibold">{w.deliverableCount}</p>
                    <Badge
                      variant={w.submitted ? 'success' : 'warning'}
                      label={w.submitted ? 'submitted' : 'pending'}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {carryoverTrend && carryoverTrend.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-base-content/60 mb-2">Carryover trend</p>
              <div className="flex items-end gap-2">
                {carryoverTrend.map((count, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold">{count}</span>
                    <div
                      className="bg-warning rounded-sm w-6"
                      style={{ height: `${Math.max(count * 8, 4)}px` }}
                    />
                    <span className="text-[10px] text-base-content/40">W{i + 1}</span>
                  </div>
                ))}
              </div>
              {carryoverTrend.length >= 2 && carryoverTrend[carryoverTrend.length - 1] > carryoverTrend[0] && (
                <p className="text-xs text-warning mt-1">Carryover growing — review backlog</p>
              )}
            </div>
          )}
        </Section.Body>
      </Section>

      <Section>
        <Section.Header icon={<LightbulbIcon size="md" />} title="IP Contributions" />
        <Section.Body>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="stat bg-base-200 rounded-btn p-3 flex-1 min-w-[120px]">
              <div className="stat-title text-xs">Commits</div>
              <div className="stat-value text-lg">{ip.totalCommits}</div>
            </div>
            <div className="stat bg-base-200 rounded-btn p-3 flex-1 min-w-[120px]">
              <div className="stat-title text-xs">Target</div>
              <div className="stat-value text-lg">{ip.targetCommits}</div>
            </div>
          </div>

          <ProgressBar value={ip.totalCommits} max={ip.targetCommits} />

          {ipItems.length > 0 && (
            <div className="mt-4 space-y-2">
              {ipItems.map((item) => (
                <div key={item.ipItemId} className="flex flex-wrap items-center justify-between gap-2 bg-base-200 rounded-btn px-3 py-2">
                  <div className="min-w-0">
                    <span className="text-sm">{item.title}</span>
                    {/* Spec B4: maturity is cumulative across every contributor and
                        all time, which is why it can outrank this month's commits. */}
                    {item.maturityLevel && item.maturityLevel !== 'none' && (
                      <p className="text-xs text-base-content/60 capitalize">
                        {item.maturityLevel}
                        {typeof item.totalCommits === 'number' && ` · ${item.totalCommits} total`}
                        {typeof item.contributors === 'number' && item.contributors > 1 &&
                          ` · ${item.contributors} contributors`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.maturityChange && item.maturityChange !== 'stable' && (
                      <Badge
                        variant={item.maturityChange === 'up' ? 'success' : 'warning'}
                        label={item.maturityChange === 'up' ? '↑ matured' : '↓ slipped'}
                        size="sm"
                      />
                    )}
                    <Badge variant="info" label={`${item.commits} commits`} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section.Body>
      </Section>
    </>
  );
}
