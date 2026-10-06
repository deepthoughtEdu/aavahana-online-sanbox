import { cn } from '@/utils';
import type { DemoMonth, AnswerDepth, V3Signal, V4Signal } from '../_data/demo-data';

// ─── Sub-components ─────────────────────────────────────────────────────────

function MonthBadge({ stage }: { stage: 1 | 6 | 12 }) {
  const colors: Record<number, string> = {
    1:  'text-neutral',
    6:  'text-warning',
    12: 'text-success',
  };
  return (
    <div className={cn('text-[11px] font-bold uppercase tracking-wider', colors[stage])}>
      Month {stage}
    </div>
  );
}

function TimeBadge({ time }: { time: string }) {
  return (
    <span className="text-[11px] font-semibold text-success bg-[var(--dt-greenDim)] px-2 py-0.5 rounded-full whitespace-nowrap">
      {time}
    </span>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm border-[1.5px] flex-shrink-0 mt-0.5 text-[10px] font-bold',
        checked
          ? 'bg-info border-info text-white'
          : 'border-base-300 bg-transparent',
      )}
    >
      {checked && '✓'}
    </span>
  );
}

const DEPTH_STYLES: Record<AnswerDepth, string> = {
  weak:   'text-neutral italic',
  strong: 'text-black',
  system: 'text-success font-medium',
};

function ThinkBlock({
  question,
  answer,
  depth,
  systemNudge,
}: {
  question: string;
  answer: string;
  depth: AnswerDepth;
  systemNudge?: string;
}) {
  return (
    <div className="bg-[var(--dt-amberDim)] border border-[var(--dt-amberBorder)] rounded-md p-2.5">
      <div className="text-[11px] font-semibold text-warning mb-1.5">{question}</div>
      <div className={cn('text-xs leading-relaxed', DEPTH_STYLES[depth])}>{answer}</div>
      {systemNudge && (
        <div className="text-[11px] text-neutral italic mt-1.5 pt-1.5 border-t border-base-300">
          System: <span className="text-warning not-italic">{systemNudge}</span>
        </div>
      )}
    </div>
  );
}

function MaturityBar({ label, percent }: { label: string; percent: number }) {
  const fillColor =
    percent >= 80 ? 'bg-success' : percent >= 50 ? 'bg-warning' : 'bg-neutral';

  return (
    <div className="mt-3 pt-2.5 border-t border-base-300">
      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral mb-1">
        {label}
      </div>
      <div className="h-1 rounded-full bg-base-200 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', fillColor)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// ─── V3 signals row ─────────────────────────────────────────────────────────

function SignalsRow({ signals }: { signals: V3Signal }) {
  const bufferBorder: Record<string, string> = {
    red: 'border-[var(--dt-redBorder)]',
    amber: 'border-[var(--dt-amberBorder)]',
    green: 'border-[var(--dt-greenBorder)]',
  };
  const bufferText: Record<string, string> = {
    red: 'text-error',
    amber: 'text-warning',
    green: 'text-success',
  };

  return (
    <div className="flex gap-2 mb-2.5">
      <div className="flex-1 bg-base-200/50 border border-base-300 rounded-md p-2">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-neutral">Throughput</div>
        <div className={cn('text-sm font-semibold', signals.throughput.trend === 'up' ? 'text-success' : 'text-error')}>
          {signals.throughput.value}
        </div>
      </div>
      <div className={cn('flex-1 bg-base-200/50 border rounded-md p-2', bufferBorder[signals.buffer.status])}>
        <div className="text-[9px] font-semibold uppercase tracking-wider text-neutral">Buffer</div>
        <div className={cn('text-sm font-semibold', bufferText[signals.buffer.status])}>
          {signals.buffer.value}
        </div>
      </div>
      <div className="flex-1 bg-base-200/50 border border-base-300 rounded-md p-2">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-neutral">Team constraint</div>
        <div className="text-[11px] font-semibold text-black">{signals.teamConstraint}</div>
      </div>
    </div>
  );
}

// ─── Action tag ─────────────────────────────────────────────────────────────

const ACTION_TAG_STYLES: Record<string, string> = {
  ESCALATE: 'text-error bg-[var(--dt-redDim)] border-[var(--dt-redBorder)]',
  SUBORDINATE: 'text-warning bg-[var(--dt-amberDim)] border-[var(--dt-amberBorder)]',
  COACH: 'text-primary bg-[var(--dt-tealDim)] border-[var(--dt-tealBorder)]',
  STRUCTURAL: 'text-[var(--vertical-v3)] bg-[var(--vertical-v3-dim)] border-[var(--vertical-v3-border)]',
};

function ActionTag({ action }: { action: string }) {
  return (
    <span className={cn('inline-block text-[10px] font-bold px-2 py-0.5 rounded border mb-1', ACTION_TAG_STYLES[action] ?? 'text-neutral bg-base-200 border-base-300')}>
      {action}
    </span>
  );
}

// ─── V4 signal block ────────────────────────────────────────────────────────

function V4SignalBlock({ signal }: { signal: V4Signal }) {
  const isYes = signal.needsDecision;
  return (
    <div className={cn(
      'rounded-md p-2.5 text-xs',
      isYes
        ? 'bg-[var(--dt-redDim)] border border-[var(--dt-redBorder)]'
        : 'bg-[var(--dt-greenDim)] border border-[var(--dt-greenBorder)]',
    )}>
      <div className={cn('text-[10px] font-bold uppercase tracking-wider mb-1', isYes ? 'text-error' : 'text-success')}>
        {isYes ? 'V4 signal — needs decision' : 'No — handling it'}
      </div>
      <div className="text-black leading-relaxed">{signal.text}</div>
    </div>
  );
}

// ─── Main card ──────────────────────────────────────────────────────────────

interface TransformationCardProps {
  month: DemoMonth;
  personName: string;
  timeBadge: string;
  questions: { dependency: string; constraint: string };
  isV3?: boolean;
  v3Signals?: V3Signal;
  v3ActionTag?: string;
  v4Signal?: V4Signal;
  labelTag?: 'auto' | 'you';
}

export function TransformationCard({
  month,
  personName,
  timeBadge,
  questions,
  isV3,
  v3Signals,
  v3ActionTag,
  v4Signal,
  labelTag,
}: TransformationCardProps) {
  return (
    <div className="bg-white border border-base-300 rounded-[9px] p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <MonthBadge stage={month.stage} />
          <div className="text-[15px] font-semibold text-black">{personName}</div>
        </div>
        <TimeBadge time={timeBadge} />
      </div>

      {/* V3 signals */}
      {isV3 && v3Signals && <SignalsRow signals={v3Signals} />}

      {/* Deliverables */}
      {month.deliverables.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral mb-1.5">
            {isV3 ? '' : 'Deliverables'}
            {labelTag && (
              <span className={cn(
                'text-[8px] font-bold tracking-normal uppercase px-1 py-px rounded ml-1 align-middle',
                labelTag === 'auto'
                  ? 'text-neutral bg-base-200'
                  : 'text-primary bg-[var(--dt-tealDim)]',
              )}>
                {labelTag}
              </span>
            )}
          </div>
          <ul className="space-y-1">
            {month.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-black">
                <Checkbox checked={d.checked} />
                <span>{d.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Q2 — Dependency / Constraint ID */}
      <div className="mb-3">
        <ThinkBlock
          question={questions.dependency}
          answer={month.dependencyAnswer.text}
          depth={month.dependencyAnswer.depth}
        />
      </div>

      {/* V3 action tag */}
      {isV3 && v3ActionTag && (
        <div className="mb-1">
          <ActionTag action={v3ActionTag} />
        </div>
      )}

      {/* Q3 — Constraint reflection / Coaching / Exploitation */}
      <div className="mb-0">
        <ThinkBlock
          question={questions.constraint}
          answer={month.constraintAnswer.text}
          depth={month.constraintAnswer.depth}
          systemNudge={month.systemNudge}
        />
      </div>

      {/* V4 signal (V3 only) */}
      {isV3 && v4Signal && (
        <div className="mt-3">
          <V4SignalBlock signal={v4Signal} />
        </div>
      )}

      {/* Maturity bar */}
      <MaturityBar label={month.maturity.label} percent={month.maturity.percent} />
    </div>
  );
}
