'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils';
import type { TimeCategory } from '@/types/aavahana/weekly-plan.types';

// ─── Stable Tailwind class maps — must be literal so Tailwind includes them ──
const ICON_BG: Record<TimeCategory['color'], string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
};


const PROGRESS_CLASS: Record<TimeCategory['color'], string> = {
  primary: 'progress-primary',
  secondary: 'progress-secondary',
  success: 'progress-success',
  warning: 'progress-warning',
  error: 'progress-error',
  info: 'progress-info',
};

const BADGE_VARIANT: Record<TimeCategory['color'], TimeCategory['color']> = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
};


interface ValueCreationSectionProps {
  categories: TimeCategory[];
  totalHours: number;
  targetHours?: number;
  valueSummary?: string;
}

export function ValueCreationSection({
  categories,
  totalHours,
  valueSummary,
}: ValueCreationSectionProps) {
  return (
    <div className="space-y-2">
      {/* ── Week summary (AI text, only shown when present) ─────────────────── */}
      {valueSummary && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs dt-text-muted leading-snug border-l-2 border-primary/40 pl-2 py-0.5"
        >
          {valueSummary}
        </motion.p>
      )}

      {/* ── Category list ────────────────────────────────────────────────── */}
      <div className="divide-y divide-base-200">
        {categories.map((cat, idx) => {
          const barPct =
            cat.targetHours > 0
              ? Math.min(100, Math.round((cat.hours / cat.targetHours) * 100))
              : 0;
          const shareOfTotal =
            totalHours > 0 ? Math.round((cat.hours / totalHours) * 100) : 0;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2.5 py-1.5"
            >
              {/* Color dot */}
              <span className={cn('w-2 h-2 rounded-full shrink-0', ICON_BG[cat.color])} />
              {/* Name + share */}
              <div className="min-w-0 flex items-baseline gap-1.5">
                <span className="text-sm font-medium truncate">{cat.name}</span>
                <span className="text-[11px] dt-text-dim shrink-0">{cat.hours}h · {shareOfTotal}%</span>
              </div>
              {/* Mini progress bar */}
              <div className="w-16 shrink-0">
                <progress
                  className={cn('progress w-full h-1.5', PROGRESS_CLASS[cat.color])}
                  value={barPct}
                  max={100}
                />
              </div>
              {/* Score badge */}
              <Badge variant={BADGE_VARIANT[cat.color]} size="sm" label={`${cat.valueScore}`} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
