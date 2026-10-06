// TEMP: Local dev mock data for AI Timetable — used as fallback when backend is unavailable
// TODO: Remove this file before pushing to production
import type { TimetableBootstrap } from '@/types/aavahana/weekly-plan.types';

export const mockTimetableBootstrap: TimetableBootstrap = {
  weekInfo: {
    startDate: '2026-02-23',
    endDate: '2026-03-01',
    weekNumber: 9,
  },
  workingHours: [
    { day: 0, startTime: '08:00', endTime: '18:00' },
    { day: 1, startTime: '08:00', endTime: '18:00' },
    { day: 2, startTime: '08:00', endTime: '18:00' },
    { day: 3, startTime: '08:00', endTime: '18:00' },
    { day: 4, startTime: '08:00', endTime: '17:00' },
  ],
  energySlots: [
    { day: 0, startTime: '08:00', endTime: '10:00', energy: 'high' },
    { day: 0, startTime: '10:00', endTime: '13:00', energy: 'medium' },
    { day: 0, startTime: '13:00', endTime: '15:00', energy: 'low' },
    { day: 0, startTime: '15:00', endTime: '18:00', energy: 'high' },
    { day: 1, startTime: '08:00', endTime: '10:30', energy: 'high' },
    { day: 1, startTime: '10:30', endTime: '13:00', energy: 'medium' },
    { day: 1, startTime: '13:00', endTime: '15:00', energy: 'low' },
    { day: 1, startTime: '15:00', endTime: '18:00', energy: 'medium' },
    { day: 2, startTime: '08:00', endTime: '11:00', energy: 'medium' },
    { day: 2, startTime: '11:00', endTime: '13:00', energy: 'high' },
    { day: 2, startTime: '13:00', endTime: '15:30', energy: 'low' },
    { day: 2, startTime: '15:30', endTime: '18:00', energy: 'high' },
    { day: 3, startTime: '08:00', endTime: '10:00', energy: 'high' },
    { day: 3, startTime: '10:00', endTime: '13:00', energy: 'medium' },
    { day: 3, startTime: '13:00', endTime: '18:00', energy: 'low' },
    { day: 4, startTime: '08:00', endTime: '11:00', energy: 'high' },
    { day: 4, startTime: '11:00', endTime: '14:00', energy: 'medium' },
    { day: 4, startTime: '14:00', endTime: '17:00', energy: 'low' },
  ],
  deliverables: [
    { id: 'deliv_001', title: 'Draft PDGMS Pricing Matrix', estimatedHours: 4, remainingHours: 2, priority: 'critical', projectName: 'PDGMS v2' },
    { id: 'deliv_002', title: 'Build Gantt Chart', estimatedHours: 8, remainingHours: 5, priority: 'high', projectName: 'Analytics Dashboard' },
    { id: 'deliv_003', title: 'Build Timesheet View', estimatedHours: 5, remainingHours: 3, priority: 'high', projectName: 'Analytics Dashboard' },
    { id: 'deliv_004', title: 'Commission AIP Lab Module 2 video', estimatedHours: 2, remainingHours: 1, priority: 'medium', projectName: 'AIP Academy' },
    { id: 'deliv_005', title: 'Analytics QA', estimatedHours: 3, remainingHours: 3, priority: 'high', projectName: 'Analytics Dashboard' },
  ],
  calendarEvents: [
    // Monday: morning deep work + late-afternoon high-priority (no overlap)
    { id: 'evt_001', title: 'Deep work: Gantt chart data layer', deliverableId: 'deliv_002', date: '2026-02-23', startTime: '09:00', endTime: '11:00', type: 'work', isHighPriority: false },
    { id: 'evt_002', title: 'AIP Lab kick-off', deliverableId: undefined, date: '2026-02-23', startTime: '15:30', endTime: '17:00', type: 'high-priority', isHighPriority: true },
    // Tuesday: single focused block
    { id: 'evt_003', title: 'Build Timesheet View', deliverableId: 'deliv_003', date: '2026-02-24', startTime: '08:00', endTime: '10:30', type: 'work', isHighPriority: false },
    // Wednesday: short review then afternoon work (2.5 h gap)
    { id: 'evt_004', title: 'Finance pricing review', deliverableId: 'deliv_001', date: '2026-02-25', startTime: '11:00', endTime: '11:30', type: 'review', isHighPriority: false },
    { id: 'evt_005', title: 'Draft PDGMS Pricing Matrix', deliverableId: 'deliv_001', date: '2026-02-25', startTime: '14:00', endTime: '16:00', type: 'work', isHighPriority: false },
    // Thursday: single QA session
    { id: 'evt_006', title: 'Analytics QA: Gantt end-to-end', deliverableId: 'deliv_005', date: '2026-02-26', startTime: '09:00', endTime: '11:00', type: 'review', isHighPriority: false },
    // Friday: deadline block
    { id: 'evt_007', title: 'Weekly report submission', deliverableId: undefined, date: '2026-02-27', startTime: '15:30', endTime: '17:00', type: 'deadline', isHighPriority: false },
  ],
};
