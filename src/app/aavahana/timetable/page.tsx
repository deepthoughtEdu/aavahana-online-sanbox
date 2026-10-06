'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
  SparklesIcon,
} from '@/components/shared/icons';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { WeeklyPlanService } from '@/lib/services/aavahana/weekly-plan.service';
import { isError } from '@/lib/api/client';
import { queryClient } from '@/lib/query/client';
import { toast } from '@/utils';
import { HighPriorityEventNudge } from '@/components/shared/HighPriorityEventNudge';
import { DAYS } from './_components/timetable.constants';
import { formatDate } from '@/utils/shared/date.utils';
import { deriveHoursRange, timeToMinutes } from './_components/timetable.helpers';
import { useEventHandlers } from './useEventHandlers';
import { SyncStatusBar } from './_components/SyncStatusBar';
import { EnergyLegend } from './_components/EnergyLegend';
import { AddEventForm } from './_components/AddEventForm';
import { PlacementBanner } from './_components/PlacementBanner';
import { TimetableGrid } from './_components/TimetableGrid';
import { TimetableList } from './_components/TimetableList';
import { DeliverablesTray } from './_components/DeliverablesTray';
import { MeetingSkipCard } from './_components/MeetingSkipCard';
import { useTimetableData } from './useTimetableData';
import type { TimetableDeliverable, CalendarEvent } from '@/types/aavahana/weekly-plan.types';

export default function TimetablePage() {
  const {
    bootstrap,
    timeBlocks,
    setTimeBlocks,
    pendingIds,
    setPendingIds,
    failedSyncIds,
    setFailedSyncIds,
    currentWeekStart,
    setCurrentWeekStart,
  } = useTimetableData();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDeliverable, setSelectedDeliverable] = useState<TimetableDeliverable | null>(null);
  const [selectedPieceHours, setSelectedPieceHours] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  // Lay the weekly plan's day-assigned tasks into time blocks (energy-aware, server-side).
  const scheduleWeek = async () => {
    setIsScheduling(true);
    const r = await WeeklyPlanService.autoScheduleWeek();
    if (isError(r)) {
      toast.error(r.error.message || "Couldn't schedule your week.");
    } else if (r.scheduled > 0) {
      toast.success(`Scheduled ${r.scheduled} task${r.scheduled === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: ['timetable-bootstrap'] });
    } else {
      toast.error('No day-assigned tasks to schedule — set days on your Weekly Plan first.');
    }
    setIsScheduling(false);
  };

  // Tick a plan-linked block complete → mark the plan task done (one-way).
  const toggleDone = async (event: CalendarEvent) => {
    if (!event.planTaskId) return;
    const res = await WeeklyPlanService.setTaskDone(
      event.planTaskId,
      !event.done,
      bootstrap?.weekInfo?.startDate,
    );
    if (isError(res)) {
      toast.error(res.error.message || "Couldn't update the task.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['timetable-bootstrap'] });
  };

  // Derived values
  const workingHours = useMemo(() => bootstrap?.workingHours ?? [], [bootstrap?.workingHours]);
  const energySlots = useMemo(() => bootstrap?.energySlots ?? [], [bootstrap?.energySlots]);
  const deliverables = useMemo(() => bootstrap?.deliverables ?? [], [bootstrap?.deliverables]);

  const HOURS = useMemo(() => deriveHoursRange(workingHours), [workingHours]);

  const weekDates = useMemo(
    () =>
      DAYS.map((_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [currentWeekStart]
  );

  const meetings = useMemo(() => timeBlocks.filter((b) => b.type === 'meeting'), [timeBlocks]);

  // Kept to avoid unused-var lint on the hook dependency
  const _focusHours = useMemo(
    () =>
      timeBlocks
        .filter((b) => b.type === 'work')
        .reduce((acc, b) => acc + (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) / 60, 0),
    [timeBlocks]
  );
  void _focusHours;

  const { deleteBlock, addEvent, handleCellClick } = useEventHandlers({
    currentWeekStart, timeBlocks, setTimeBlocks,
    setPendingIds, setFailedSyncIds,
    selectedDeliverable, selectedPieceHours, setSelectedDeliverable,
    setShowAddEvent, setSelectedDay,
  });

  const navigateWeek = (dir: 'prev' | 'next') => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + (dir === 'next' ? 7 : -7));
    setCurrentWeekStart(d);
  };

  return (
    <div className="min-h-screen bg-base-200 pb-20 flex flex-col">
      <PageHeader
        title="AI Timetable"
        subtitle="Time management is the edge. Block your growth before reactive work claims the week."
      >
        {/* Week navigation + view controls in one header bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button color="primary" variant="outline" size="sm" shape="circle"
            onClick={() => navigateWeek('prev')} iconBefore={<ChevronLeftIcon size="sm" />} />
          <Button color="primary" variant="outline" size="sm" className="pointer-events-none">
            {formatDate(weekDates[0], "MMM D")}
            {' — '}
            {formatDate(weekDates[6], "MMM D, YYYY")}
          </Button>
          <Button color="primary" variant="outline" size="sm" shape="circle"
            onClick={() => navigateWeek('next')} iconBefore={<ChevronRightIcon size="sm" />} />

          <div className="w-px h-5 bg-base-300 mx-1" />

          {/* Grid / List toggle */}
          <div className="join">
            <Button
              color="primary"
              variant={viewMode === 'grid' ? undefined : 'outline'}
              size="sm"
              className="join-item"
              onClick={() => setViewMode('grid')}
            >
              <GridIcon size="sm" /> Grid
            </Button>
            <Button
              color="primary"
              variant={viewMode === 'list' ? undefined : 'outline'}
              size="sm"
              className="join-item"
              onClick={() => setViewMode('list')}
            >
              <ListIcon size="sm" /> List
            </Button>
          </div>

          <Button color="primary" size="sm" onClick={() => { setSelectedDay(0); setShowAddEvent(true); }}>
            <PlusIcon size="sm" /> Add Event
          </Button>

          <Button
            color="secondary"
            size="sm"
            loading={isScheduling}
            onClick={scheduleWeek}
            iconBefore={!isScheduling ? <SparklesIcon size="sm" /> : undefined}
            tooltip={{ text: "Lay your plan's tasks into time blocks", position: 'bottom' }}
          >
            Schedule my week
          </Button>
        </div>
      </PageHeader>

      <div className="w-full space-y-6 flex-1">
        <SyncStatusBar pendingCount={pendingIds.size} failedCount={failedSyncIds.size} />

        {/* Inline AddEventForm — above grid */}
        {showAddEvent && (
          <div className="px-4 sm:px-6">
            <AddEventForm
              selectedDay={selectedDay}
              onAdd={addEvent}
              onClose={() => setShowAddEvent(false)}
            />
          </div>
        )}

        {/*  Timetable (grid or list)  */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' && (
            <motion.div key="grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <TimetableGrid
                HOURS={HOURS}
                weekDates={weekDates}
                workingHours={workingHours}
                energySlots={energySlots}
                timeBlocks={timeBlocks}
                pendingIds={pendingIds}
                failedSyncIds={failedSyncIds}
                selectedDeliverable={selectedDeliverable}
                onCellClick={handleCellClick}
                onDeleteBlock={deleteBlock}
                onAddEventDay={(day) => { setSelectedDay(day); setShowAddEvent(true); }}
                onToggleDone={toggleDone}
              />
            </motion.div>
          )}
          {viewMode === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <TimetableList
                weekDates={weekDates}
                timeBlocks={timeBlocks}
                pendingIds={pendingIds}
                failedSyncIds={failedSyncIds}
                onDeleteBlock={deleteBlock}
                onAddFirst={() => { setSelectedDay(0); setShowAddEvent(true); }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/*  Energy legend — below timetable  */}
        <EnergyLegend />

        {/* PlacementBanner popup — above deliverables, below heading (where chart was) */}
        <div className="px-4 sm:px-6">
          {selectedDeliverable && (
            <PlacementBanner
              deliverable={selectedDeliverable}
              pieceHours={selectedPieceHours}
              onPieceHoursChange={setSelectedPieceHours}
              onCancel={() => setSelectedDeliverable(null)}
            />
          )}
        </div>

        {/*  Deliverables (cards only, Gantt/chart removed)  */}
        <DeliverablesTray
          deliverables={deliverables}
          selectedDeliverable={selectedDeliverable}
          onSelect={(d) => {
            setSelectedDeliverable(d);
            if (d) setSelectedPieceHours(Math.min(2, d.remainingHours));
          }}
        />

        {/* High-priority event nudge — Add to calendar — at page bottom */}
        <div className="px-4 sm:px-6">
          <HighPriorityEventNudge
            sourceScreen="/aavahana/timetable"
            onEventAdded={(evt) =>
              setTimeBlocks((prev) => [
                ...prev,
                { ...evt, type: 'high-priority', isHighPriority: true },
              ])
            }
          />
        </div>
      </div>

      {/*  Meeting you could skip — fixed at page bottom  */}
      <div className="w-full px-4 sm:px-6 py-6 bg-base-100 border-t border-base-300">
        <MeetingSkipCard
          meetings={meetings}
          onSkip={deleteBlock}
        />
      </div>
    </div>
  );
}
