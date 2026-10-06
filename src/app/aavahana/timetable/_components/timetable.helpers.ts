import type { CalendarEvent, EnergySlot, WorkingHours } from '@/types/aavahana/weekly-plan.types';

export const ROW_PX = 52;

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Returns the energy classification for a specific day+hour cell */
export function getEnergyForCell(
  energySlots: EnergySlot[],
  day: number,
  hour: number
): string | null {
  const target = hour * 60;
  const slot = energySlots.find(
    (s) =>
      s.day === day &&
      timeToMinutes(s.startTime) <= target &&
      target < timeToMinutes(s.endTime)
  );
  return slot?.energy ?? null;
}

/** Returns true if this hour is within working hours for the day */
export function isWorkingHour(wh: WorkingHours[], day: number, hour: number): boolean {
  const entry = wh.find((w) => w.day === day);
  if (!entry) return false;
  return (
    hour >= Math.floor(timeToMinutes(entry.startTime) / 60) &&
    hour < Math.ceil(timeToMinutes(entry.endTime) / 60)
  );
}

/** Derive the set of hours to show — union of all working hours across days */
export function deriveHoursRange(workingHours: WorkingHours[]): number[] {
  if (!workingHours.length) return Array.from({ length: 10 }, (_, i) => i + 8);
  let min = 24;
  let max = 0;
  for (const w of workingHours) {
    const s = Math.floor(timeToMinutes(w.startTime) / 60);
    const e = Math.ceil(timeToMinutes(w.endTime) / 60);
    if (s < min) min = s;
    if (e > max) max = e;
  }
  return Array.from({ length: max - min }, (_, i) => i + min);
}

/** Returns pixel top + height for absolute-positioned event cards */
export function getBlockPosition(
  block: CalendarEvent,
  hoursRange: number[]
): { top: number; height: number } {
  const firstHour = hoursRange[0] ?? 8;
  const startMin = timeToMinutes(block.startTime) - firstHour * 60;
  const durationMin = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
  return {
    top: (startMin / 60) * ROW_PX,
    height: Math.max(20, (durationMin / 60) * ROW_PX),
  };
}
