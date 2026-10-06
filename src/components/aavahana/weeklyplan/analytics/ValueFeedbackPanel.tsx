'use client';

import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils';
import type { ValueFeedbackSuggestion } from '@/types/aavahana/weekly-plan.types';

const PRIORITY_CONFIG = {
  high: {
    badge: 'error' as const,
    label: 'High Priority',
    borderClass: 'border-l-error',
    bgClass: 'bg-error/10',
  },
  medium: {
    badge: 'warning' as const,
    label: 'Medium',
    borderClass: 'border-l-warning',
    bgClass: 'bg-warning/10',
  },
  low: {
    badge: 'success' as const,
    label: 'Low',
    borderClass: 'border-l-success',
    bgClass: 'bg-success/10',
  },
};

interface ValueFeedbackPanelProps {
  suggestions: ValueFeedbackSuggestion[];
}

export function ValueFeedbackPanel({ suggestions }: ValueFeedbackPanelProps) {
  if (!suggestions.length) return null;

  return (
    <div className="space-y-2">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-warning" />
          <h3 className="font-semibold text-sm">Improve your week</h3>
        </div>
        <Badge variant="neutral" size="sm" label={`${suggestions.length} tips`} />
      </div>

      {/* Suggestion list */}
      <div className="space-y-2">
        {suggestions.map((s, idx) => {
          const cfg = PRIORITY_CONFIG[s.priority];

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={cn(
                'border-l-2 pl-3 py-1',
                cfg.borderClass
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold leading-snug">{s.title}</h4>
                <Badge variant={cfg.badge} size="sm" label={cfg.label} />
              </div>
              <p className="text-[11px] text-base-content/55 leading-snug mt-0.5 line-clamp-2">
                {s.body}
              </p>
              <p className="text-[10px] dt-text-dim mt-0.5 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 shrink-0" />
                {s.expectedImpact}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
