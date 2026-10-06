'use client';

import { useEffect, useState } from 'react';
import { WeeklyPlanService } from '@/lib/services/aavahana/weekly-plan.service';
import { useApi } from '@/lib/hooks/shared/use-api';
import { isError } from '@/lib/api/client';
// TEMP: Mock fallback for local development without backend
// TODO: Remove this import before pushing to production
import { mockTimetableBootstrap } from '@/lib/mocks/aavahana-timetable-mock';
import { loadOfflineQueue, saveOfflineQueue } from './_components/timetable.types';
import type { CalendarEvent, TimetableBootstrap } from '@/types/aavahana/weekly-plan.types';

interface UseTimetableDataReturn {
  bootstrap: TimetableBootstrap;
  timeBlocks: CalendarEvent[];
  setTimeBlocks: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  pendingIds: Set<string>;
  setPendingIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  failedSyncIds: Set<string>;
  setFailedSyncIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  currentWeekStart: Date;
  setCurrentWeekStart: React.Dispatch<React.SetStateAction<Date>>;
  setBootstrap: React.Dispatch<React.SetStateAction<TimetableBootstrap>>;
}

export function useTimetableData(): UseTimetableDataReturn {
  const [bootstrap, setBootstrap] = useState<TimetableBootstrap>(mockTimetableBootstrap);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    new Date(mockTimetableBootstrap.weekInfo.startDate)
  );
  const [timeBlocks, setTimeBlocks] = useState<CalendarEvent[]>(
    mockTimetableBootstrap.calendarEvents ?? []
  );
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [failedSyncIds, setFailedSyncIds] = useState<Set<string>>(new Set());

  // Step 1: merge offline-queued events immediately on mount (before API responds)
  useEffect(() => {
    const offlineQueue = loadOfflineQueue();
    const offlineEvents = [...offlineQueue.values()].map((e) => e.event);
    if (offlineEvents.length > 0) {
      setTimeBlocks((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        return [...prev, ...offlineEvents.filter((e) => !existingIds.has(e.id))];
      });
      setPendingIds(
        new Set(
          [...offlineQueue.entries()]
            .filter(([, v]) => v.status === 'pending')
            .map(([k]) => k)
        )
      );
      setFailedSyncIds(
        new Set(
          [...offlineQueue.entries()]
            .filter(([, v]) => v.status === 'failed')
            .map(([k]) => k)
        )
      );
    }
  }, []);

  // Step 2: bootstrap fetch via React Query (caches + dedupes)
  const { data: bootstrapData } = useApi({
    queryKey: ["timetable-bootstrap"],
    queryFn: () => WeeklyPlanService.getTimetableBootstrap(),
  });

  // Step 3: when bootstrap arrives, replace mock data and flush offline queue
  // H10-exempt: offline-first queue flush needs to happen after bootstrap; isMounted not
  // needed here since setters are stable React dispatch functions (no stale closure risk).
  useEffect(() => {
    if (!bootstrapData) return;

    setBootstrap(bootstrapData);
    setCurrentWeekStart(new Date(bootstrapData.weekInfo.startDate));

    const offlineQueue = loadOfflineQueue();
    const offlineEvents = [...offlineQueue.values()].map((e) => e.event);
    const serverIds = new Set(bootstrapData.calendarEvents.map((e) => e.id));
    const localOnlyEvents = offlineEvents.filter((e) => !serverIds.has(e.id));
    setTimeBlocks([...bootstrapData.calendarEvents, ...localOnlyEvents]);

    // Flush offline queue now that we have connectivity
    for (const [id, entry] of offlineQueue.entries()) {
      WeeklyPlanService.createCalendarEvent(entry.payload).then((r) => {
        const q = loadOfflineQueue();
        if (!isError(r)) {
          q.delete(id);
          saveOfflineQueue(q);
          setTimeBlocks((prev) => prev.map((b) => (b.id === id ? r : b)));
          setPendingIds((s) => { const n = new Set(s); n.delete(id); return n; });
          setFailedSyncIds((s) => { const n = new Set(s); n.delete(id); return n; });
        } else {
          const existing = q.get(id);
          if (existing) { q.set(id, { ...existing, status: 'failed' }); saveOfflineQueue(q); }
          setPendingIds((s) => { const n = new Set(s); n.delete(id); return n; });
          setFailedSyncIds((s) => new Set(s).add(id));
        }
      });
    }
  }, [bootstrapData]);

  return {
    bootstrap,
    setBootstrap,
    timeBlocks,
    setTimeBlocks,
    pendingIds,
    setPendingIds,
    failedSyncIds,
    setFailedSyncIds,
    currentWeekStart,
    setCurrentWeekStart,
  };
}
