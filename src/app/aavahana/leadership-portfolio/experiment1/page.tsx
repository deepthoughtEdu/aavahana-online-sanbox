'use client';

import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/shared/Badge';

// ---------------------------------------------------------------------------
// Mock data — shapes match backend computeFromData()
// See: PDGMSDocs/ToDo/leadership-portfolio-prototype.md#backend-data-model-reference
// ---------------------------------------------------------------------------
const MOCK = {
  uid: 'LP-2026-04-T042',
  monthLabel: 'April 2026',
  generatedAt: '2026-04-20T14:30:00Z',

  contributions: {
    ipCommitCount: 14,
    recentCommits: [
      { id: 1, description: 'Assessment Framework v2 — rubric engine',      createdAt: '2026-04-18T10:00:00Z' },
      { id: 2, description: 'Assessment Framework v2 — scoring module',     createdAt: '2026-04-15T14:00:00Z' },
      { id: 3, description: 'Assessment Framework v2 — report generator',   createdAt: '2026-04-12T09:00:00Z' },
      { id: 4, description: 'Assessment Framework v2 — data import',        createdAt: '2026-04-08T11:00:00Z' },
      { id: 5, description: 'Curriculum Mapping Tool — matrix view',        createdAt: '2026-04-06T16:00:00Z' },
      { id: 6, description: 'Curriculum Mapping Tool — alignment check',    createdAt: '2026-04-04T10:00:00Z' },
      { id: 7, description: 'Curriculum Mapping Tool — export PDF',         createdAt: '2026-04-02T13:00:00Z' },
    ],
    totalDeliverables: 54,
    completed: 42,
    inProgress: 8,
    pendingQa: 3,
    notStarted: 1,
    narrative:
      '42/54 deliverables completed (78%). 14 verified IP commits — top items: Assessment Framework v2 (4 commits), Curriculum Mapping Tool (3 commits). 8 deliverables still in progress, 3 pending QA.',
  },

  capability: {
    deliveryRate:   78,
    ipScore:        72,
    frameworkScore: 65,
    processScore:   58,
    ritualScore:    84,
    narrative:
      'Delivery rate at 78% with IP score of 72. Framework mastery at 65 across 4 claimed frameworks. Process score at 58 — lowest axis, focus area for next month. Ritual participation strong at 84%.',
  },

  placeholderSections: [
    'Executive Summary',
    'KPI Impact',
    'Constraint Patterns',
    'Career Trajectory',
  ],
} as const;

const CAPABILITY_THRESHOLD = 60;

// ---------------------------------------------------------------------------
// Sub-components (all inline — single-file experiment)
// ---------------------------------------------------------------------------

/** Layer 1 — The Signal */
function SignalCard({ headline }: { headline: string }) {
  const parts = headline.split(' · ');
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl px-6 py-5 text-center">
      <p className="text-lg sm:text-xl font-semibold text-base-content">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-base-content/40 mx-1">·</span>}
            {part}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}

/** Layer 2a — Contribution Story */
function ContributionStory() {
  const c = MOCK.contributions;
  const completionPct = Math.round((c.completed / c.totalDeliverables) * 100);

  const stats = [
    { label: 'IP Commits',  value: c.ipCommitCount },
    { label: 'In Progress', value: c.inProgress },
    { label: 'QA Pending',  value: c.pendingQa },
    { label: 'Not Started', value: c.notStarted },
  ];

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl p-5">
      <p className="text-base font-semibold text-base-content mb-2">What I Contributed</p>
      <p className="text-sm text-base-content/80 leading-relaxed mb-4">{c.narrative}</p>

      <progress className="progress progress-primary w-full" value={completionPct} max={100} />
      <p className="text-xs text-base-content/60 mt-1">{c.completed} of {c.totalDeliverables} delivered</p>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {stats.map(stat => (
          <div key={stat.label} className="bg-base-200 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-base-content/50">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Layer 2b — Capability Story */
function CapabilityStory({ axes }: { axes: Array<{ label: string; score: number }> }) {
  const cap = MOCK.capability;

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl p-5">
      <p className="text-base font-semibold text-base-content mb-2">How I&apos;m Growing</p>
      <p className="text-sm text-base-content/80 leading-relaxed mb-4">{cap.narrative}</p>

      <div className="space-y-2">
        {axes.map(a => (
          <div key={a.label} className="flex items-center gap-3">
            <span className="w-20 text-xs text-base-content/60 text-right shrink-0">{a.label}</span>
            <div className="relative flex-1 h-3 bg-base-300 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${a.score >= CAPABILITY_THRESHOLD ? 'bg-primary' : 'bg-warning'}`}
                style={{ width: `${a.score}%` }}
              />
              {/* Threshold marker — dynamic position, accepted inline style exception */}
              <div
                className="absolute top-0 bottom-0 w-px bg-base-content/30"
                style={{ left: `${CAPABILITY_THRESHOLD}%` }}
              />
            </div>
            <span className={`w-8 text-xs font-semibold text-right ${a.score < CAPABILITY_THRESHOLD ? 'text-warning' : 'text-base-content'}`}>
              {a.score}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-base-content/30 mt-2 pl-24">threshold: {CAPABILITY_THRESHOLD}</p>
    </div>
  );
}

/** Collapse wrapper for Layer 3 evidence items */
function EvidenceCollapse({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <details className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-lg">
      <summary className="collapse-title text-sm font-medium min-h-0 py-3">
        {title} <span className="text-base-content/40">({count})</span>
      </summary>
      <div className="collapse-content">{children}</div>
    </details>
  );
}

/** Layer 3 — Evidence (collapsed by default) */
function EvidenceSection({ axes }: { axes: Array<{ label: string; score: number }> }) {
  const c = MOCK.contributions;

  return (
    <div className="space-y-2">
      <EvidenceCollapse title="Recent IP Commits" count={c.recentCommits.length}>
        <ul className="space-y-1">
          {c.recentCommits.map(commit => (
            <li key={commit.id} className="flex items-center justify-between text-xs py-1">
              <span className="text-base-content/80">{commit.description}</span>
              <span className="text-base-content/40 shrink-0 ml-2">
                {new Date(commit.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </span>
            </li>
          ))}
        </ul>
      </EvidenceCollapse>

      <EvidenceCollapse title="Deliverable Breakdown" count={c.totalDeliverables}>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'Completed',   value: c.completed,   cls: 'text-success' },
            { label: 'In Progress', value: c.inProgress,  cls: '' },
            { label: 'Pending QA',  value: c.pendingQa,   cls: 'text-warning' },
            { label: 'Not Started', value: c.notStarted,  cls: 'text-error' },
          ].map(row => (
            <div key={row.label} className="flex justify-between bg-base-200 rounded px-2 py-1">
              <span className="text-base-content/60">{row.label}</span>
              <span className={`font-semibold ${row.cls}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </EvidenceCollapse>

      <EvidenceCollapse title="Axis Score Details" count={axes.length}>
        <div className="space-y-1">
          {axes.map(a => (
            <div key={a.label} className="flex items-center justify-between text-xs bg-base-200 rounded px-2 py-1">
              <span className="text-base-content/60">{a.label}</span>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${a.score < CAPABILITY_THRESHOLD ? 'text-warning' : ''}`}>
                  {a.score}
                </span>
                <span className="text-base-content/30">/ {CAPABILITY_THRESHOLD}</span>
                <span className={a.score >= CAPABILITY_THRESHOLD ? 'text-success' : 'text-warning'}>
                  {a.score >= CAPABILITY_THRESHOLD ? 'above' : 'below'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </EvidenceCollapse>
    </div>
  );
}

/** Layer 4 — Placeholder grid (dimmed future sections) */
function PlaceholderGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {MOCK.placeholderSections.map(title => (
        <div key={title} className="card bg-base-100 border border-base-300 rounded-lg opacity-40">
          <div className="card-body py-6 text-center">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-base-content/50">Available in full version</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Footer — UID stamp */
function PortfolioFooter() {
  return (
    <div className="text-center space-y-2 pt-4">
      <p className="text-xs text-base-content/40">
        {MOCK.monthLabel} · UID: {MOCK.uid} · Generated{' '}
        {new Date(MOCK.generatedAt).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
      <div className="badge badge-warning badge-outline text-xs gap-1">
        Experiment 1 — static mock data for UX validation
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ExperimentPage() {
  const { capability: cap } = MOCK;

  const axes = [
    { label: 'Delivery',  score: cap.deliveryRate },
    { label: 'IP',        score: cap.ipScore },
    { label: 'Framework', score: cap.frameworkScore },
    { label: 'Process',   score: cap.processScore },
    { label: 'Ritual',    score: cap.ritualScore },
  ];

  const c = MOCK.contributions;
  const axesAboveThreshold = axes.filter(a => a.score >= CAPABILITY_THRESHOLD).length;
  const signalHeadline = `${c.completed} of ${c.totalDeliverables} delivered · ${c.ipCommitCount} IP commits · ${axesAboveThreshold}/5 axes above threshold`;

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader title="Leadership Portfolio" subtitle={MOCK.monthLabel}>
        <Badge variant="warning" size="sm" label="Experiment 1" />
      </PageHeader>

      <div className="w-full max-w-3xl mx-auto space-y-4 px-4 sm:px-6 mt-4">
        <SignalCard headline={signalHeadline} />
        <ContributionStory />
        <CapabilityStory axes={axes} />
        <EvidenceSection axes={axes} />
        <PlaceholderGrid />
        <PortfolioFooter />
      </div>
    </div>
  );
}
