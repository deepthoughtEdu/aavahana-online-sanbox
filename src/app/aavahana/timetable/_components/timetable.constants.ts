import type { CalendarEvent, TimetableDeliverable } from '@/types/aavahana/weekly-plan.types';

export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// PDGMS palette only (theme-aware --dt-* tokens + daisyUI semantic colors).
// Opaque dim backgrounds + matching semantic text so the event title stays
// readable over the energy-coloured cell beneath it.
export const EVENT_COLORS: Record<CalendarEvent['type'], string> = {
  work: 'bg-[var(--dt-tealDim)] border-[var(--dt-tealBorder)] text-primary',
  meeting: 'bg-accent/10 border-accent/40 text-accent',
  review: 'bg-[var(--dt-greenDim)] border-[var(--dt-greenBorder)] text-success',
  deadline: 'bg-[var(--dt-redDim)] border-[var(--dt-redBorder)] text-error',
  'high-priority':
    'bg-[var(--dt-amberDim)] border-[var(--dt-amberBorder)] text-warning ring-1 ring-[var(--dt-amberBorder)]',
};

export const ENERGY_CELL_COLORS: Record<string, string> = {
  high: 'bg-[var(--dt-greenDim)]',
  medium: 'bg-[var(--dt-amberDim)]',
  low: 'bg-[var(--dt-redDim)]',
};

export const PRIORITY_COLORS: Record<TimetableDeliverable['priority'], string> = {
  critical: 'border-[var(--dt-redBorder)] bg-[var(--dt-redDim)]',
  high: 'border-[var(--dt-amberBorder)] bg-[var(--dt-amberDim)]',
  medium: 'border-[var(--dt-tealBorder)] bg-[var(--dt-tealDim)]',
  low: 'border-base-300 bg-base-100',
};

export const OFFLINE_CACHE_KEY = 'timetable_offline_v1';
