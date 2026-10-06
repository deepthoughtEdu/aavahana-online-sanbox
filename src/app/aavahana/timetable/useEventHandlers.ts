'use client';
// H10-WONTFIX: .then() chains here are intentional optimistic mutations — fire-and-forget
// event handlers that update local state on response. No cleanup needed (no subscriptions,
// no AbortController required) since these are discrete user actions, not mount effects.

import { useRef } from 'react';
import { WeeklyPlanService } from '@/lib/services/aavahana/weekly-plan.service';
import { isError } from '@/lib/api/client';
import { formatDate } from '@/utils/shared/date.utils';
import { minutesToTime } from './_components/timetable.helpers';
import { loadOfflineQueue, saveOfflineQueue } from './_components/timetable.types';
import type { CalendarEvent, TimetableDeliverable } from '@/types/aavahana/weekly-plan.types';

interface UseEventHandlersOptions {
  currentWeekStart: Date;
  timeBlocks: CalendarEvent[];
  setTimeBlocks: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  setPendingIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setFailedSyncIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedDeliverable: TimetableDeliverable | null;
  selectedPieceHours: number;
  setSelectedDeliverable: (d: TimetableDeliverable | null) => void;
  setShowAddEvent: (v: boolean) => void;
  setSelectedDay: (d: number | null) => void;
}

interface AddEventPayload {
  title: string;
  type: CalendarEvent['type'];
  startTime: string;
  endTime: string;
}

function syncResult(
  r: CalendarEvent | { error: unknown },
  tempId: string,
  setTimeBlocks: UseEventHandlersOptions['setTimeBlocks'],
  setPendingIds: UseEventHandlersOptions['setPendingIds'],
  setFailedSyncIds: UseEventHandlersOptions['setFailedSyncIds']
) {
  const q = loadOfflineQueue();
  if (!isError(r)) {
    q.delete(tempId); saveOfflineQueue(q);
    setTimeBlocks((prev) => prev.map((b) => b.id === tempId ? r as CalendarEvent : b));
    setPendingIds((s) => { const n = new Set(s); n.delete(tempId); return n; });
    setFailedSyncIds((s) => { const n = new Set(s); n.delete(tempId); return n; });
  } else {
    const existing = q.get(tempId);
    if (existing) { q.set(tempId, { ...existing, status: 'failed' }); saveOfflineQueue(q); }
    setPendingIds((s) => { const n = new Set(s); n.delete(tempId); return n; });
    setFailedSyncIds((s) => new Set(s).add(tempId));
  }
}

export function useEventHandlers({
  currentWeekStart, timeBlocks, setTimeBlocks,
  setPendingIds, setFailedSyncIds,
  selectedDeliverable, selectedPieceHours, setSelectedDeliverable,
  setShowAddEvent, setSelectedDay,
}: UseEventHandlersOptions) {
  const placingRef = useRef(false);

  const deleteBlock = (id: string) => {
    const q = loadOfflineQueue();
    if (q.has(id)) {
      q.delete(id); saveOfflineQueue(q);
      setTimeBlocks((prev) => prev.filter((b) => b.id !== id));
      setPendingIds((s) => { const n = new Set(s); n.delete(id); return n; });
      setFailedSyncIds((s) => { const n = new Set(s); n.delete(id); return n; });
      return;
    }
    const removed = timeBlocks.find((b) => b.id === id);
    setTimeBlocks((prev) => prev.filter((b) => b.id !== id));
    setFailedSyncIds((s) => { const n = new Set(s); n.delete(id); return n; });
    WeeklyPlanService.deleteCalendarEvent(id).then((r) => {
      if (isError(r) && removed) setTimeBlocks((prev) => [...prev, removed]);
    });
  };

  const addEvent = (evt: AddEventPayload, day: number) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + day);
    const tempId = `local_${Date.now()}`;
    const payload = {
      title: evt.title.trim(), date: formatDate(date, "date"),
      startTime: evt.startTime, endTime: evt.endTime, type: evt.type,
    };
    const localEvt: CalendarEvent = {
      id: tempId, title: payload.title, deliverableId: undefined,
      date: payload.date, startTime: payload.startTime, endTime: payload.endTime,
      type: payload.type, isHighPriority: payload.type === 'high-priority',
    };
    const q = loadOfflineQueue();
    q.set(tempId, { event: localEvt, payload, status: 'pending' });
    saveOfflineQueue(q);
    setTimeBlocks((prev) => [...prev, localEvt]);
    setPendingIds((s) => new Set(s).add(tempId));
    setShowAddEvent(false);
    setSelectedDay(null);
    WeeklyPlanService.createCalendarEvent(payload).then(
      (r) => syncResult(r, tempId, setTimeBlocks, setPendingIds, setFailedSyncIds)
    );
  };

  const handleCellClick = (dayIndex: number, hour: number) => {
    if (!selectedDeliverable || placingRef.current) return;
    placingRef.current = true;
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    const startTime = minutesToTime(hour * 60);
    const endTime = minutesToTime(hour * 60 + selectedPieceHours * 60);
    const tempId = `local_${Date.now()}`;
    const snap = selectedDeliverable;
    const payload = {
      title: snap.title, deliverableId: snap.id,
      date: formatDate(date, "date"), startTime, endTime,
      type: 'work' as CalendarEvent['type'],
    };
    const localEvt: CalendarEvent = {
      id: tempId, title: snap.title, deliverableId: snap.id,
      date: payload.date, startTime, endTime, type: 'work', isHighPriority: false,
    };
    const q = loadOfflineQueue();
    q.set(tempId, { event: localEvt, payload, status: 'pending' });
    saveOfflineQueue(q);
    setTimeBlocks((prev) => [...prev, localEvt]);
    setPendingIds((s) => new Set(s).add(tempId));
    setSelectedDeliverable(null);
    placingRef.current = false;
    WeeklyPlanService.createCalendarEvent(payload).then(
      (r) => syncResult(r, tempId, setTimeBlocks, setPendingIds, setFailedSyncIds)
    );
  };

  return { deleteBlock, addEvent, handleCellClick };
}
