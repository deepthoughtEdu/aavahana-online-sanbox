'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrashIcon, ClockIcon } from '@/components/shared/icons';
import { Circle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils';
import { formatDate } from '@/utils/shared/date.utils';
import { DAYS, EVENT_COLORS, ENERGY_CELL_COLORS } from './timetable.constants';
import { getEnergyForCell, isWorkingHour, getBlockPosition } from './timetable.helpers';
import { timeToMinutes } from './timetable.helpers';
import type { CalendarEvent, WorkingHours, EnergySlot, TimetableDeliverable } from '@/types/aavahana/weekly-plan.types';

// ── Overlap layout ────────────────────────────────────────────────
// Groups events by start time and assigns row indices for vertical stacking
interface LayoutBlock {
  block: CalendarEvent;
  col: number;
  totalCols: number;
  row: number;
  totalRows: number;
}

function layoutEvents(blocks: CalendarEvent[]): LayoutBlock[] {
  const sorted = [...blocks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  // Group events by start time only — blocks are already filtered per-day column
  const startTimeGroups: Map<string, CalendarEvent[]> = new Map();
  sorted.forEach(block => {
    const key = block.startTime;
    if (!startTimeGroups.has(key)) {
      startTimeGroups.set(key, []);
    }
    startTimeGroups.get(key)!.push(block);
  });

  // Assign row numbers based on grouping
  return sorted.map(block => {
    const key = block.startTime;
    const group = startTimeGroups.get(key)!;
    const row = group.indexOf(block);
    const totalRows = group.length;
    return {
      block,
      col: 0,
      totalCols: 1,
      row,
      totalRows,
    };
  });
}
// ─────────────────────────────────────────────────────────────────

interface TimetableGridProps {
  HOURS: number[];
  weekDates: Date[];
  workingHours: WorkingHours[];
  energySlots: EnergySlot[];
  timeBlocks: CalendarEvent[];
  pendingIds: Set<string>;
  failedSyncIds: Set<string>;
  selectedDeliverable: TimetableDeliverable | null;
  onCellClick: (dayIndex: number, hour: number) => void;
  onDeleteBlock: (id: string) => void;
  onAddEventDay: (dayIndex: number) => void;
  onToggleDone?: (event: CalendarEvent) => void;
}

export function TimetableGrid({
  HOURS,
  weekDates,
  workingHours,
  energySlots,
  timeBlocks,
  pendingIds,
  failedSyncIds,
  selectedDeliverable,
  onCellClick,
  onDeleteBlock,
  onAddEventDay,
  onToggleDone,
}: TimetableGridProps) {
  // Pre-compute blocks per day once — avoids O(7 * n) filter + Date allocations per render
  const blocksByDay = useMemo(
    () =>
      DAYS.map((_, dayIndex) =>
        timeBlocks.filter((b) => {
          const bd = new Date(b.date);
          const sd = new Date(weekDates[0]);
          bd.setHours(0, 0, 0, 0);
          sd.setHours(0, 0, 0, 0);
          return Math.round((bd.getTime() - sd.getTime()) / 86400000) === dayIndex;
        })
      ),
    [timeBlocks, weekDates]
  );

  return (
    <div className="bg-base-100 rounded-box overflow-hidden border border-base-300 mx-4 sm:mx-6">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header row */}
          <div className="grid grid-cols-8 border-b border-base-300">
            <div className="p-4 text-sm font-medium text-neutral">Time</div>
            {DAYS.map((day, i) => (
              <div key={day} className="p-4 text-center border-l border-base-300">
                <div className="text-sm font-semibold">{day.slice(0, 3)}</div>
                <div className="text-xs text-neutral mt-1">
                  {formatDate(weekDates[i], "MMM D")}
                </div>
                {!workingHours.find((w) => w.day === i) && (
                  <div className="text-xs text-neutral/60 mt-1">off</div>
                )}
              </div>
            ))}
          </div>

          {/* Time rows + event overlay */}
          <div className="relative">
            {/* Background: hour rows — energy colours + click targets */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8 border-b border-base-300/50"
                style={{ height: 52 }}
              >
                <div className="p-2 text-xs font-medium text-neutral border-r border-base-300/50 flex items-start pt-3">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {DAYS.map((_, dayIndex) => {
                  const working = isWorkingHour(workingHours, dayIndex, hour);
                  const energy = working ? getEnergyForCell(energySlots, dayIndex, hour) : null;
                  const isPlaceable = !!selectedDeliverable && working;
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      onClick={() => {
                        if (isPlaceable) {
                          onCellClick(dayIndex, hour);
                        } else if (working) {
                          onAddEventDay(dayIndex);
                        }
                      }}
                      className={cn(
                        'border-l border-base-300/50 transition-colors',
                        working ? '' : 'bg-base-200/60 opacity-40 pointer-events-none',
                        energy ? ENERGY_CELL_COLORS[energy] : '',
                        isPlaceable &&
                          'cursor-crosshair hover:bg-[var(--dt-tealDim)] ring-inset ring-1 ring-[var(--dt-tealBorder)]',
                        !isPlaceable && working && 'cursor-pointer hover:bg-base-200/50'
                      )}
                    />
                  );
                })}
              </div>
            ))}

            {/* Event overlay — event cards only; clicks handled by background cells */}
            <div
              className="absolute inset-0"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)' }}
            >
              <div />
              {DAYS.map((_, dayIndex) => (
                <div key={dayIndex} className="relative">
                  {layoutEvents(blocksByDay[dayIndex]).map(({ block, col, totalCols, row, totalRows }) => {
                    const pos = getBlockPosition(block, HOURS);
                    const isPending = pendingIds.has(block.id);
                    const isFailed = failedSyncIds.has(block.id);
                    const isRecurring = block.source === 'recurring';
                    const leftPct = (col / totalCols) * 100;
                    const widthPct = (1 / totalCols) * 100;
                    const cellHeight = 52;
                    const stackedHeight = Math.max(20, cellHeight / totalRows);
                    const stackedTop = pos.top + (row * stackedHeight);
                    return (
                      <motion.div
                        key={block.id}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        title={isRecurring ? 'Managed from monthly plan' : undefined}
                        className={cn(
                          'absolute rounded border-l-4 px-1.5 py-1 text-xs group overflow-hidden',
                          EVENT_COLORS[block.type],
                          isPending && 'opacity-75 border-dashed',
                          isFailed && 'ring-1 ring-[var(--dt-redBorder)] opacity-80',
                          isRecurring && 'border-dashed opacity-85',
                          block.done && 'opacity-60'
                        )}
                        style={{
                          top: stackedTop,
                          height: stackedHeight,
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                          zIndex: 10,
                        }}
                      >
                        <div className="flex items-start justify-between gap-0.5">
                          <div className="flex items-start gap-1 flex-1 min-w-0">
                            {block.planTaskId && onToggleDone && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleDone(block);
                                }}
                                className="shrink-0 mt-0.5"
                                aria-label={block.done ? 'Mark task not done' : 'Mark task done'}
                              >
                                {block.done ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                              </button>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn('font-semibold truncate leading-tight', block.done && 'line-through')}>
                                {isRecurring && <ClockIcon size="xs" className="inline-block mr-0.5 -mt-0.5" />}
                                {block.isHighPriority && '⭐ '}
                                {block.title}
                              </p>
                              <p className="opacity-70 text-[10px]">
                                {block.startTime}–{block.endTime}
                                {isPending && (
                                  <span className="ml-1 text-warning">
                                    · syncing
                                  </span>
                                )}
                                {isFailed && (
                                  <span className="ml-1 text-error">· not synced</span>
                                )}
                              </p>
                            </div>
                          </div>
                          {!isRecurring && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBlock(block.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <TrashIcon size="xs" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
