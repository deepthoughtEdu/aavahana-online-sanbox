import type { CalendarEvent } from '@/types/aavahana/weekly-plan.types';
import { OFFLINE_CACHE_KEY } from './timetable.constants';

export interface OfflineEntry {
  event: CalendarEvent;
  payload: {
    title: string;
    deliverableId?: string;
    date: string;
    startTime: string;
    endTime: string;
    type: CalendarEvent['type'];
  };
  status: 'pending' | 'failed';
}

export function loadOfflineQueue(): Map<string, OfflineEntry> {
  try {
    if (typeof window === 'undefined') return new Map();
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (!raw) return new Map();
    return new Map(JSON.parse(raw));
  } catch {
    return new Map();
  }
}

export function saveOfflineQueue(q: Map<string, OfflineEntry>): void {
  try {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify([...q]));
  } catch {}
}
