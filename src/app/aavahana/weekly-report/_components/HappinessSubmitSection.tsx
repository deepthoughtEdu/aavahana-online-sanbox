'use client';

import { useState } from 'react';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import type { ReportStatus } from '@/types/aavahana/pdgms.types';

interface HappinessSubmitSectionProps {
  status: ReportStatus;
  happiness: number;
  setHappiness: (value: number) => void;
  onSubmit: (notes?: string) => Promise<void>;
  isSubmitting: boolean;
}

export function HappinessSubmitSection({
  status,
  happiness,
  setHappiness,
  onSubmit,
  isSubmitting,
}: HappinessSubmitSectionProps) {
  const [notes, setNotes] = useState('');
  const isSubmitted = status === 'submitted' || status === 'locked';

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-success/10 border border-success/20 px-4 py-3">
        <span className="text-sm text-success font-medium">Weekly report submitted</span>
        <Badge variant="success" size="sm" label={status} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs text-neutral">How was your week? (1 = rough, 10 = excellent)</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral">1</span>
          <input
            type="range"
            min={1}
            max={10}
            value={happiness}
            onChange={(e) => setHappiness(Number(e.target.value))}
            className="range range-primary flex-1"
            step={1}
          />
          <span className="text-xs text-neutral">10</span>
          <Badge variant="primary" size="lg" icon={null} className="w-10">
            {happiness}
          </Badge>
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anything to add for the narrative? (optional)"
        className="textarea textarea-bordered textarea-sm w-full resize-none"
        rows={2}
      />

      <Button
        color="primary"
        modifier="block"
        onClick={() => onSubmit(notes || undefined)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="loading loading-spinner loading-xs" />
            Generating narrative…
          </>
        ) : (
          'Submit Weekly Report'
        )}
      </Button>
    </div>
  );
}
