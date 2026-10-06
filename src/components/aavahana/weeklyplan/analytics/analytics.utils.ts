/**
 * Analytics module — shared utilities, constants and pure functions.
 * All exports are free of React/Next.js so they can be unit-tested directly.
 */

import type { TimeCategory, ValueFeedbackSuggestion } from '@/types/aavahana/weekly-plan.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimesheetEntry {
  id: string;
  date: string;
  deliverableId: string;
  deliverableName: string;
  projectName: string;
  hours: number;
  description: string;
  type: 'work' | 'meeting' | 'review' | 'research';
}

export interface TimeAllocation {
  allocation: Record<string, number>;
  total: number;
}

export type FilterPeriod = 'week' | 'month' | 'custom';

interface CategoryDefaults {
  targetHours: number;
  valueScore: number;
  valueLabel: string;
  companyImpact: string;
  color: TimeCategory['color'];
}

// ─── Category defaults (used as fallback until AI endpoint is live) ───────────

export const CATEGORY_DEFAULTS: Record<string, CategoryDefaults> = {
  'deep work': {
    targetHours: 20,
    valueScore: 85,
    valueLabel: 'Core product output',
    companyImpact: 'Features built, technical debt addressed, infrastructure improved',
    color: 'primary',
  },
  meeting: {
    targetHours: 8,
    valueScore: 60,
    valueLabel: 'Team alignment & decisions',
    companyImpact: 'Blockers removed, stakeholders informed, priorities clarified',
    color: 'secondary',
  },
  learning: {
    targetHours: 6,
    valueScore: 75,
    valueLabel: 'Capability building',
    companyImpact: 'Skills sharpened, new tools explored, knowledge retained',
    color: 'success',
  },
  admin: {
    targetHours: 4,
    valueScore: 40,
    valueLabel: 'Operations & overhead',
    companyImpact: 'Processes followed, records maintained, compliance met',
    color: 'warning',
  },
  review: {
    targetHours: 4,
    valueScore: 70,
    valueLabel: 'Quality assurance',
    companyImpact: 'Bugs caught, code quality raised, peers unblocked',
    color: 'info',
  },
  planning: {
    targetHours: 4,
    valueScore: 72,
    valueLabel: 'Direction & strategy',
    companyImpact: 'Roadmap refined, sprint goals clarified, risks anticipated',
    color: 'secondary',
  },
  'client-facing': {
    targetHours: 4,
    valueScore: 78,
    valueLabel: 'Client & stakeholder value',
    companyImpact: 'Relationships strengthened, demos delivered, trust built',
    color: 'error',
  },
};

export const FALLBACK_DEFAULTS: CategoryDefaults = {
  targetHours: 4,
  valueScore: 55,
  valueLabel: 'General contribution',
  companyImpact: 'Time spent contributing to team and company goals',
  color: 'primary',
};

export const WEEKLY_HOUR_TARGET = 40;

// ─── Pure utility functions ───────────────────────────────────────────────────

/**
 * Filter timesheet entries to a given period and aggregate hours by type.
 * Uses a provided `now` date (defaults to `new Date()`) for deterministic testing.
 */
export function computeTimeAllocation(
  entries: TimesheetEntry[],
  period: FilterPeriod,
  now: Date = new Date()
): TimeAllocation {
  const allocation: Record<string, number> = {};

  const filtered = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    switch (period) {
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return entryDate >= weekStart;
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return entryDate >= monthStart;
      }
      default:
        return true;
    }
  });

  filtered.forEach((entry) => {
    allocation[entry.type] = (allocation[entry.type] || 0) + entry.hours;
  });

  const total = Object.values(allocation).reduce((sum, h) => sum + h, 0);
  return { allocation, total };
}

/**
 * Compute a progress status token for the allocation progress bar.
 */
export function computeProgressStatus(
  percent: number
): 'success' | 'warning' | 'primary' | 'ghost' {
  if (percent >= 100) return 'success';
  if (percent >= 75) return 'warning';
  if (percent >= 40) return 'primary';
  return 'ghost';
}

/**
 * Derive a capped 0-100 percentage.
 */
export function toPercent(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

/**
 * Derive the gantt time-allocation categories into typed TimeCategory objects.
 */
export function deriveCategories(
  timeAllocation: Array<{ category: string; hours: number }>
): TimeCategory[] {
  return timeAllocation.map((item) => {
    const key = item.category.toLowerCase();
    const defaults = CATEGORY_DEFAULTS[key] ?? FALLBACK_DEFAULTS;
    return {
      id: item.category.toLowerCase().replace(/\s+/g, '-'),
      name: item.category,
      hours: item.hours,
      targetHours: defaults.targetHours,
      valueScore: defaults.valueScore,
      valueLabel: defaults.valueLabel,
      companyImpact: defaults.companyImpact,
      color: defaults.color,
    };
  });
}

/**
 * Build a human-readable focus-ratio summary string from gantt data.
 */
export function buildValueSummary(focusRatio: number, untrackedHours: number): string {
  const tracked =
    untrackedHours > 0
      ? `${untrackedHours}h untracked — log all work for a complete picture.`
      : 'All hours accounted for.';
  return `${focusRatio.toFixed(0)}% of logged hours were focused sessions. ${tracked}`;
}

/**
 * Generate exactly 3 personalised feedback suggestions based on category proportions.
 * Pure function — safe to unit test.
 */
export function deriveFeedbackSuggestions(
  categories: TimeCategory[],
  totalHours: number
): ValueFeedbackSuggestion[] {
  const byName = (n: string) =>
    categories.find((c) => c.name.toLowerCase() === n.toLowerCase());

  const deepWork = byName('Deep Work');
  const meetings = byName('Meeting');
  const learning = byName('Learning');
  const admin = byName('Admin');

  const suggestions: ValueFeedbackSuggestion[] = [];

  // ── 1. Deep-work ratio ───────────────────────────────────────────────────
  if (deepWork && totalHours > 0 && deepWork.hours / totalHours < 0.4) {
    suggestions.push({
      id: 'sg-1',
      title: 'Protect more focused deep-work blocks',
      body: `You invested ${deepWork.hours}h in deep work — below the 40% threshold that drives highest output. Try blocking two 2-hour focus sessions each morning before checking messages or attending stand-ups.`,
      expectedImpact: '+20% feature throughput',
      priority: 'high',
      categoryId: 'deep-work',
    });
  } else {
    suggestions.push({
      id: 'sg-1',
      title: 'Sustain your deep-work momentum',
      body: 'Your deep-work ratio is healthy this week. Keep protecting these blocks by batching admin tasks into a single end-of-day slot and using "Do Not Disturb" mode during focus sessions.',
      expectedImpact: 'Maintain high and consistent output',
      priority: 'medium',
      categoryId: 'deep-work',
    });
  }

  // ── 2. Meeting overhead ──────────────────────────────────────────────────
  if (meetings && totalHours > 0 && meetings.hours / totalHours > 0.25) {
    suggestions.push({
      id: 'sg-2',
      title: 'Reduce meeting overhead',
      body: `Meetings consumed ${meetings.hours}h (${Math.round((meetings.hours / totalHours) * 100)}% of your week). Audit recurring meetings: drop anything without a clear agenda, convert status updates to async written summaries, and cap your meeting slots to a 2-hour window per day.`,
      expectedImpact: 'Recover ~3h/week for deep work',
      priority: 'high',
      categoryId: 'meeting',
    });
  } else {
    suggestions.push({
      id: 'sg-2',
      title: 'Shift status updates to async',
      body: 'Your meeting load is within healthy bounds. Moving regular status check-ins to a short written summary lets teammates read in their own time and reduces context switching for both parties.',
      expectedImpact: 'Save ~1–2h/week team-wide',
      priority: 'medium',
      categoryId: 'meeting',
    });
  }

  // ── 3. Learning or admin ─────────────────────────────────────────────────
  if (learning && learning.hours < 3) {
    suggestions.push({
      id: 'sg-3',
      title: 'Schedule protected learning time',
      body: 'Learning this week was limited. Block 1 hour on Friday afternoons for deliberate skill practice — reading, a course, or a spike investigation. Over a quarter this compounds into a significant capability advantage.',
      expectedImpact: '+15% long-term efficiency',
      priority: 'medium',
      categoryId: 'learning',
    });
  } else if (admin && totalHours > 0 && admin.hours / totalHours > 0.15) {
    suggestions.push({
      id: 'sg-3',
      title: 'Automate or delegate admin tasks',
      body: `Admin consumed ${admin.hours}h this week. Identify repeatable tasks (status reporting, scheduling) and either template them, automate with simple scripts, or delegate to free up high-value thinking time.`,
      expectedImpact: 'Recover ~2h/week',
      priority: 'low',
      categoryId: 'admin',
    });
  } else {
    suggestions.push({
      id: 'sg-3',
      title: 'Share your learnings with the team',
      body: 'Your learning investment is above average. A brief weekly "Today I Learned" note in the team channel multiplies the value of your personal learning across the whole organisation.',
      expectedImpact: 'Amplify team capability at zero extra cost',
      priority: 'low',
      categoryId: 'learning',
    });
  }

  return suggestions.slice(0, 3);
}
