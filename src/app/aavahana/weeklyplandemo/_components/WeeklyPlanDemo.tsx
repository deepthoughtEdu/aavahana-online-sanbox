'use client';

import { useState } from 'react';
import { cn } from '@/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { verticalLevelColors } from '@/utils/shared/design.utils';
import { TransformationCard } from './TransformationCard';
import {
  DEMO_CONTEXTS,
  V3_SIGNALS,
  V3_ACTION_TAGS,
  V3_V4_SIGNALS,
  type DemoVLevel,
} from '../_data/demo-data';

// ─── Context tabs ───────────────────────────────────────────────────────────

function ContextTabs({
  contexts,
  activeId,
  onSelect,
}: {
  contexts: typeof DEMO_CONTEXTS;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex justify-center gap-2 mb-8">
      {contexts.map((ctx) => (
        <button
          key={ctx.id}
          onClick={() => onSelect(ctx.id)}
          className={cn(
            'px-4 py-2 rounded-md text-[13px] font-semibold tracking-wide border transition-all',
            ctx.id === activeId
              ? 'border-[var(--dt-tealBorder)] bg-[var(--dt-tealDim)] text-primary'
              : 'border-base-300 bg-white text-neutral hover:border-[var(--dt-tealBorder)]',
          )}
        >
          {ctx.label}
        </button>
      ))}
    </div>
  );
}

// ─── V-level section ────────────────────────────────────────────────────────

function VLevelSection({
  level,
  contextId,
}: {
  level: DemoVLevel;
  contextId: string;
}) {
  const vKey = level.badge as keyof typeof verticalLevelColors;
  const vColors = verticalLevelColors[vKey];
  const isV3 = level.badge === 'V3';
  const labelTag = level.badge === 'V1' ? 'auto' as const : level.badge === 'V2' ? 'you' as const : undefined;

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-baseline gap-3 mb-1">
        <span className={cn(
          'text-[13px] font-bold tracking-wider px-2.5 py-0.5 rounded border',
          vColors.text, vColors.bg, vColors.border,
        )}>
          {level.badge}
        </span>
        <h2 className="text-lg font-semibold text-black">
          {level.person.name} — {level.person.role}
        </h2>
      </div>
      <p className="text-xs text-neutral mb-1">{level.person.subtitle}</p>
      <div className="text-[13px] text-neutral bg-base-200/50 border border-base-300 rounded-md px-3 py-2 mb-4">
        <strong className="text-black">3m:</strong> {level.goals.months3}.{' '}
        <strong className="text-black">6m:</strong> {level.goals.months6}.{' '}
        <strong className="text-black">1y:</strong> {level.goals.year1}.
      </div>

      {/* Timeline grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {level.months.map((month) => (
          <TransformationCard
            key={month.stage}
            month={month}
            personName={level.person.name}
            timeBadge={level.timeBadge}
            questions={level.questions}
            isV3={isV3}
            v3Signals={isV3 ? V3_SIGNALS[contextId]?.[month.stage] : undefined}
            v3ActionTag={isV3 ? V3_ACTION_TAGS[contextId]?.[month.stage] : undefined}
            v4Signal={isV3 ? V3_V4_SIGNALS[contextId]?.[month.stage] : undefined}
            labelTag={labelTag}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main demo component ────────────────────────────────────────────────────

export function WeeklyPlanDemo() {
  const [activeCtx, setActiveCtx] = useState(DEMO_CONTEXTS[0].id);
  const context = DEMO_CONTEXTS.find((c) => c.id === activeCtx) ?? DEMO_CONTEXTS[0];

  return (
    <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-8">
      <PageHeader
        label="Aavahana"
        title="Weekly Plan — Transformation Arc"
        subtitle="Same questions. Sharper observer. Month 1 → Month 6 → Month 12."
      />

      <p className="text-center text-[13px] text-neutral italic -mt-2 mb-6">
        &ldquo;The form doesn&rsquo;t change. The thinking deepens.&rdquo;
      </p>

      <ContextTabs
        contexts={DEMO_CONTEXTS}
        activeId={activeCtx}
        onSelect={setActiveCtx}
      />

      {context.levels.map((level) => (
        <VLevelSection key={level.badge} level={level} contextId={context.id} />
      ))}
    </div>
  );
}
