'use client';

import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { SparklesIcon } from '@/components/shared/icons';
import type { ClaimSummary, RitualSummary } from '@/types';

interface CapabilitySummaryProps {
  frameworks?: ClaimSummary;
  processes?: ClaimSummary;
  rituals?: RitualSummary;
}

const EMPTY_CLAIMS: ClaimSummary = { totalQuantity: 0, claims: [] } as ClaimSummary;
const EMPTY_RITUALS: RitualSummary = { participated: 0, total: 0 } as RitualSummary;

function ClaimList({ title, claims }: { title: string; claims?: ClaimSummary }) {
  const safe = claims ?? EMPTY_CLAIMS;
  const items = safe.claims ?? [];

  if (items.length === 0) {
    return (
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">{title}</p>
        <p className="text-sm text-base-content/60">No claims this month.</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{title}</p>
        <Badge variant="info" label={`${safe.totalQuantity ?? 0} total`} size="sm" />
      </div>
      <div className="space-y-1">
        {items.map((c) => (
          <div key={c.labelId} className="flex items-center justify-between bg-base-200 rounded-btn px-3 py-2">
            <span className="text-sm">{c.labelName}</span>
            <span className="text-xs font-medium">{c.totalQuantity ?? c.quantity}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CapabilitySummary({ frameworks, processes, rituals }: CapabilitySummaryProps) {
  const safeRituals = rituals ?? EMPTY_RITUALS;
  const ritualPct = safeRituals.total > 0 ? Math.round((safeRituals.participated / safeRituals.total) * 100) : 0;

  return (
    <Section>
      <Section.Header icon={<SparklesIcon size="md" />} title="Capabilities" subtitle="Frameworks, Processes & Rituals" />
      <Section.Body>
        <ClaimList title="Frameworks" claims={frameworks} />
        <ClaimList title="Processes" claims={processes} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Rituals</p>
            <span className="text-xs text-base-content/60">
              {safeRituals.participated}/{safeRituals.total} participated ({ritualPct}%)
            </span>
          </div>
          <progress className="progress progress-primary w-full" value={safeRituals.participated} max={safeRituals.total} />
        </div>
      </Section.Body>
    </Section>
  );
}
