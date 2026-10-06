'use client';

import { motion } from 'framer-motion';
import { CalendarIcon, ClockIcon, PlusIcon, TrashIcon } from '@/components/shared/icons';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/utils';
import { containerPadding, gaps } from '@/utils/shared/design.utils';
import { formatDate } from '@/utils/shared/date.utils';
import { DAYS, EVENT_COLORS } from './timetable.constants';
import type { CalendarEvent } from '@/types/aavahana/weekly-plan.types';

interface TimetableListProps {
  weekDates: Date[];
  timeBlocks: CalendarEvent[];
  pendingIds: Set<string>;
  failedSyncIds: Set<string>;
  onDeleteBlock: (id: string) => void;
  onAddFirst: () => void;
}

export function TimetableList({
  weekDates,
  timeBlocks,
  pendingIds,
  failedSyncIds,
  onDeleteBlock,
  onAddFirst,
}: TimetableListProps) {
  const getBlocksForDay = (dayIndex: number) =>
    timeBlocks.filter((b) => {
      const bd = new Date(b.date);
      const sd = new Date(weekDates[0]);
      bd.setHours(0, 0, 0, 0);
      sd.setHours(0, 0, 0, 0);
      return Math.round((bd.getTime() - sd.getTime()) / 86400000) === dayIndex;
    });

  return (
    <div className={cn('flex flex-col px-4 sm:px-6', gaps.lg)}>
      {DAYS.map((day, dayIndex) => {
        const dayBlocks = getBlocksForDay(dayIndex);
        if (dayBlocks.length === 0) return null;
        return (
          <motion.div
            key={day}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: dayIndex * 0.04 }}
            className={cn('bg-base-100 rounded-box', containerPadding.xl)}
          >
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold">{day}</h3>
                <p className="text-sm text-neutral">
                  {formatDate(weekDates[dayIndex], "MMMM D")}
                </p>
              </div>
              <Badge variant="ghost" size="sm">
                {dayBlocks.length} event{dayBlocks.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="space-y-2">
              {dayBlocks
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((block) => {
                  const isPending = pendingIds.has(block.id);
                  const isFailed = failedSyncIds.has(block.id);
                  return (
                    <motion.div
                      key={block.id}
                      whileHover={{ scale: 1.005 }}
                      className={cn(
                        'rounded-lg border-l-4 flex items-start justify-between gap-4',
                        containerPadding.md,
                        EVENT_COLORS[block.type]
                      )}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <ClockIcon size="md" className="mt-0.5 opacity-60" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">
                            {block.isHighPriority && <span className="mr-1">⭐</span>}
                            {block.title}
                          </h4>
                          <p className="text-xs opacity-70 mt-0.5">
                            {block.startTime} – {block.endTime}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant="neutral" size="sm">
                              {block.type}
                            </Badge>
                            {block.deliverableId && (
                              <Badge variant="ghost" size="sm">
                                Deliverable linked
                              </Badge>
                            )}
                            {block.isHighPriority && (
                              <Badge variant="warning" size="sm">
                                Non-negotiable
                              </Badge>
                            )}
                            {isPending && (
                              <Badge variant="ghost" size="sm">
                                syncing…
                              </Badge>
                            )}
                            {isFailed && (
                              <Badge variant="warning" size="sm">
                                not synced
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteBlock(block.id)}
                        className="btn btn-ghost btn-sm btn-circle"
                      >
                        <TrashIcon size="sm" />
                      </button>
                    </motion.div>
                  );
                })}
            </div>
          </motion.div>
        );
      })}

      {timeBlocks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn('bg-base-100 rounded-box text-center', containerPadding['2xl'])}
        >
          <CalendarIcon size="2xl" className="mx-auto text-neutral/60 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No events yet</h3>
          <p className="text-neutral mb-6">
            Start by scheduling a deliverable or adding an event above.
          </p>
          <Button color="primary" onClick={onAddFirst}>
            <PlusIcon size="sm" /> Add First Event
          </Button>
        </motion.div>
      )}
    </div>
  );
}
