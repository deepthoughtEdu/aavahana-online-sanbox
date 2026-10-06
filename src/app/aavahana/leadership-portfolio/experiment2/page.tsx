'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/shared/Badge';

const MOCK = {
  uid: 'LP-2026-04-T042',
  monthLabel: 'April 2026',
  generatedAt: '2026-04-20T14:30:00Z',

  employee: {
    name: 'Tarun Rigor',
    role: 'Program Associate',
    program: 'PDGMS',
  },

  contributions: {
    ipCommitCount: 14,
    recentCommits: [
      { id: 1, description: 'Assessment Framework v2 — rubric engine', createdAt: '2026-04-18T10:00:00Z' },
      { id: 2, description: 'Assessment Framework v2 — scoring module', createdAt: '2026-04-15T14:00:00Z' },
      { id: 3, description: 'Assessment Framework v2 — report generator', createdAt: '2026-04-12T09:00:00Z' },
      { id: 4, description: 'Assessment Framework v2 — data import', createdAt: '2026-04-08T11:00:00Z' },
      { id: 5, description: 'Curriculum Mapping Tool — matrix view', createdAt: '2026-04-06T16:00:00Z' },
      { id: 6, description: 'Curriculum Mapping Tool — alignment check', createdAt: '2026-04-04T10:00:00Z' },
      { id: 7, description: 'Curriculum Mapping Tool — export PDF', createdAt: '2026-04-02T13:00:00Z' },
    ],
    totalDeliverables: 54,
    completed: 42,
    inProgress: 8,
    pendingQa: 3,
    notStarted: 1,
    narrative:
      'Completed most of what was planned this month. The Assessment Framework v2 was the major push — four contributions landed across rubric design, scoring, reporting, and data import. The Curriculum Mapping Tool also saw steady progress with three contributions. 8 items still in flight, 3 awaiting review.',
  },

  capability: {
    deliveryRate: 78,
    ipScore: 72,
    frameworkScore: 65,
    processScore: 58,
    ritualScore: 84,
    narrative:
      'Delivery and engagement are strong — both well above the growth threshold. Knowledge work and framework application are solid. Process adoption is the one area to focus on next month — it is the only score below the threshold.',
  },

  placeholderSections: [
    'Executive Summary',
    'KPI Impact',
    'Constraint Patterns',
    'Career Trajectory',
  ],
} as const;

const CAPABILITY_THRESHOLD = 60;

export default function ExperimentPage() {
  const { contributions: c, capability: cap } = MOCK;

  const completionPct = Math.round((c.completed / c.totalDeliverables) * 100);

  const axes = [
    { label: 'Delivery', score: cap.deliveryRate },
    { label: 'Knowledge', score: cap.ipScore },
    { label: 'Frameworks', score: cap.frameworkScore },
    { label: 'Processes', score: cap.processScore },
    { label: 'Engagement', score: cap.ritualScore },
  ];

  const axesAboveThreshold = axes.filter((a) => a.score >= CAPABILITY_THRESHOLD).length;

  const deliveryWord = completionPct >= 80 ? 'Strong' : completionPct >= 60 ? 'Solid' : 'Mixed';

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader title="Leadership Portfolio" subtitle={MOCK.monthLabel}>
        <Badge variant="warning" size="sm" label="Experiment 2" />
      </PageHeader>

      <div className="w-full max-w-3xl mx-auto space-y-5 px-4 sm:px-6 mt-4">
        <IdentityBar />
        <SignalCard deliveryWord={deliveryWord} completionPct={completionPct} axesAbove={axesAboveThreshold} />
        <DeliveryStory completionPct={completionPct} />
        <GrowthStory axes={axes} />
        <EvidenceSection axes={axes} />
        <PlaceholderGrid />
        <PortfolioFooter />
      </div>
    </div>
  );
}

function IdentityBar() {
  return (
    <div className="px-1">
      <p className="text-xl font-semibold text-base-content">{MOCK.employee.name}</p>
      <p className="text-sm text-base-content/60">
        {MOCK.employee.role} · {MOCK.employee.program}
      </p>
    </div>
  );
}

function SignalCard({
  deliveryWord,
  completionPct,
  axesAbove,
}: {
  deliveryWord: string;
  completionPct: number;
  axesAbove: number;
}) {
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl px-6 py-6 text-center">
      <p className="text-lg sm:text-xl font-medium text-base-content leading-relaxed">
        {deliveryWord} delivery month — {completionPct}% completion.
      </p>
      <p className="text-lg sm:text-xl font-medium text-base-content/70 leading-relaxed">
        Growing in {axesAbove} of 5 areas.
      </p>
    </div>
  );
}

function DeliveryStory({ completionPct }: { completionPct: number }) {
  const { contributions: c } = MOCK;

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl p-5">
      <h2 className="text-base font-semibold text-base-content mb-3">What I Delivered</h2>

      <p className="text-sm text-base-content/80 leading-relaxed mb-4">{c.narrative}</p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-base-200 rounded-lg px-4 py-3 text-center">
          <p className="text-2xl font-bold text-base-content">{c.completed}</p>
          <p className="text-xs text-base-content/50">Delivered</p>
          <p className="text-xs text-base-content/40">out of {c.totalDeliverables} planned</p>
        </div>
        <div className="bg-base-200 rounded-lg px-4 py-3 text-center">
          <p className="text-2xl font-bold text-base-content">{c.ipCommitCount}</p>
          <p className="text-xs text-base-content/50">Original Work</p>
          <p className="text-xs text-base-content/40">contributions</p>
        </div>
      </div>

      <progress className="progress progress-primary w-full" value={completionPct} max={100} />
    </div>
  );
}

function GrowthStory({ axes }: { axes: Array<{ label: string; score: number }> }) {
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl p-5">
      <h2 className="text-base font-semibold text-base-content mb-3">How I&apos;m Growing</h2>

      <p className="text-sm text-base-content/80 leading-relaxed mb-4">{MOCK.capability.narrative}</p>

      <div className="space-y-3">
        {axes.map((a) => (
          <div key={a.label} className="flex items-center gap-3">
            <span className="w-24 text-xs text-base-content/60 text-right shrink-0">{a.label}</span>
            <div className="relative flex-1 h-3 bg-base-300 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${a.score >= CAPABILITY_THRESHOLD ? 'bg-primary' : 'bg-warning'}`}
                style={{ width: `${a.score}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-px bg-base-content/30"
                style={{ left: `${CAPABILITY_THRESHOLD}%` }}
              />
            </div>
            <span
              className={`w-8 text-xs font-semibold text-right ${a.score < CAPABILITY_THRESHOLD ? 'text-warning' : 'text-base-content'}`}
            >
              {a.score}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-base-content/30 mt-2 pl-28">threshold: {CAPABILITY_THRESHOLD}</p>
    </div>
  );
}

function EvidenceSection({ axes }: { axes: Array<{ label: string; score: number }> }) {
  const { contributions: c } = MOCK;

  return (
    <div className="space-y-2">
      <EvidenceCollapse title="Recent Work" count={c.recentCommits.length + 4}>
        <p className="text-xs text-base-content/50 uppercase tracking-wide mb-2">Deliverable Status</p>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          {[
            { label: 'Completed', value: c.completed, cls: 'text-success' },
            { label: 'In Progress', value: c.inProgress, cls: '' },
            { label: 'Awaiting Review', value: c.pendingQa, cls: 'text-warning' },
            { label: 'Not Started', value: c.notStarted, cls: 'text-error' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between bg-base-200 rounded px-2 py-1">
              <span className="text-base-content/60">{row.label}</span>
              <span className={`font-semibold ${row.cls}`}>{row.value}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-base-content/50 uppercase tracking-wide mb-2 mt-3">Original Work Log</p>
        <ul className="space-y-1">
          {c.recentCommits.map((commit) => (
            <li key={commit.id} className="flex items-center justify-between text-xs py-1">
              <span className="text-base-content/80">{commit.description}</span>
              <span className="text-base-content/40 shrink-0 ml-2">
                {new Date(commit.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </span>
            </li>
          ))}
        </ul>
      </EvidenceCollapse>

      <EvidenceCollapse title="Growth Area Details" count={axes.length}>
        <div className="space-y-1">
          {axes.map((a) => (
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

function PlaceholderGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {MOCK.placeholderSections.map((title) => (
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
        Experiment 2 — static mock data for UX validation
      </div>
    </div>
  );
}
