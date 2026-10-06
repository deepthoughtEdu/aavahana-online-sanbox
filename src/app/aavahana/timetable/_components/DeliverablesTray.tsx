'use client';

import { motion } from 'framer-motion';
import { Section } from '@/components/shared/Section';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils';
import { PRIORITY_COLORS } from './timetable.constants';
import type { TimetableDeliverable } from '@/types/aavahana/weekly-plan.types';

const DAY_LABEL: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

interface DeliverablesTrayProps {
  deliverables: TimetableDeliverable[];
  selectedDeliverable: TimetableDeliverable | null;
  onSelect: (deliverable: TimetableDeliverable | null) => void;
}

export function DeliverablesTray({
  deliverables,
  selectedDeliverable,
  onSelect,
}: DeliverablesTrayProps) {
  const visible = deliverables.filter((d) => d.remainingHours > 0);
  if (visible.length === 0) return null;

  return (
    <Section>
      <Section.Header
        title="Deliverables"
        subtitle="Your weekly plan's tasks. Use “Schedule my week” to auto-place them by day, or select one and click a slot."
      />
      <Section.Body>
        <div className="flex flex-wrap gap-3">
          {visible.map((deliverable) => {
            const isSelected = selectedDeliverable?.id === deliverable.id;

            return (
              <motion.button
                key={deliverable.id}
                onClick={() => onSelect(isSelected ? null : deliverable)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all w-52 relative',
                  PRIORITY_COLORS[deliverable.priority],
                  isSelected
                    ? 'ring-2 ring-primary border-[var(--dt-tealBorder)] shadow-lg'
                    : 'hover:shadow-md'
                )}
              >
                {/* Hours remaining pill */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-full',
                      deliverable.priority === 'critical'
                        ? 'bg-[var(--dt-redDim)] text-error'
                        : deliverable.priority === 'high'
                          ? 'bg-[var(--dt-amberDim)] text-warning'
                          : 'bg-[var(--dt-tealDim)] text-primary'
                    )}
                  >
                    {deliverable.remainingHours}h left
                  </span>
                  <span className="text-[10px] text-neutral">
                    of {deliverable.estimatedHours}h
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-base-300/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-current opacity-40 rounded-full transition-all"
                    style={{
                      width: `${((deliverable.estimatedHours - deliverable.remainingHours) / deliverable.estimatedHours) * 100}%`,
                    }}
                  />
                </div>

                <p className="text-xs font-semibold leading-snug line-clamp-2">
                  {deliverable.title}
                </p>
                <p className="text-[10px] text-neutral">{deliverable.projectName}</p>

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    <Badge variant="ghost" size="sm" className="capitalize">
                      {deliverable.priority}
                    </Badge>
                    {deliverable.day && DAY_LABEL[deliverable.day] && (
                      <Badge variant="primary" size="sm">
                        {DAY_LABEL[deliverable.day]}
                      </Badge>
                    )}
                  </div>
                  {isSelected ? (
                    <span className="text-[10px] text-primary font-semibold animate-pulse">
                      Placing...
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral">Tap to place</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-neutral italic">
          The top 1% schedule their growth first — transactional work fills whatever space remains.
        </p>
      </Section.Body>
    </Section>
  );
}
