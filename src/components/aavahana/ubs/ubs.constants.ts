// UBS Drill constants — static maps, no LLM
// Connects each event type to its cascade purpose + affordance link

export interface EventPurpose {
  done: string;
  pending: string;
  link?: string;
}

export const EVENT_PURPOSE: Record<string, EventPurpose> = {
  daily_plan_submit: {
    done: "Your plan fed deliverables into today's report",
    pending: "Plan your day to feed your report",
    link: "/aavahana/daily-plan",
  },
  daily_report_submit: {
    done: "Your reflection is captured — constraints and learning logged",
    pending: "Capture what you learned today",
    link: "/aavahana/daily-report",
  },
  weekly_plan_submit: {
    done: "Your week is structured — deliverables and time blocks set",
    pending: "Structure your week ahead",
    link: "/aavahana/weekly-plan",
  },
  weekly_report_submit: {
    done: "Your time patterns are now visible in analytics",
    pending: "Review your week's time patterns",
    link: "/aavahana/weekly-report",
  },
  monthly_plan_submit: {
    done: "Your monthly direction is set — KPIs and IP goals locked",
    pending: "Set your monthly direction",
    link: "/aavahana/monthly-plan",
  },
  threadbuilding: {
    done: "You practiced articulating your work narrative",
    pending: "Practice articulating your work narrative",
    link: "/aavahana/threadbuilder",
  },
  sd_pitch: {
    done: "You sharpened your structured delivery skills",
    pending: "Sharpen your structured delivery",
    link: "/aavahana/pitch",
  },
  ldi_pitch: {
    done: "You rehearsed your leadership delivery",
    pending: "Rehearse your leadership delivery",
    link: "/aavahana/pitch",
  },
  ritual_participation: {
    done: "You participated in a team ritual — coordination logged",
    pending: "Join a scheduled ritual",
  },
  feedback_given: {
    done: "You shared a reflection — growth signal sent",
    pending: "Reflect on a team member",
    link: "/aavahana/feedback",
  },
  ip_goal_updated: {
    done: "Your IP goals are tracked and visible",
    pending: "Update your IP goals",
    link: "/aavahana/ip",
  },
  lifecycleParticipation: {
    done: "You moved an improvement through its lifecycle — recognition signal logged",
    pending: "Move an improvement forward when this drill activates",
  },
};

// Forward ritual key (growth-execution FE-W1.4). Mirrors the backend
// DEFAULT_RITUAL_WEIGHTS entry. Weight 0 now so it renders at every config tier
// without scoring anything; FE-W3.2 turns on the weight when the
// lifecycle-weighted PMS lands, so UBS and PMS converge instead of double-count.
export const LIFECYCLE_PARTICIPATION_KEY = "lifecycleParticipation";
export const LIFECYCLE_PARTICIPATION_LABEL = "Lifecycle Participation";
export const LIFECYCLE_PARTICIPATION_RITUAL: { weight: number; label: string } = {
  weight: 0,
  label: LIFECYCLE_PARTICIPATION_LABEL,
};

/**
 * Ensure the lifecycle-participation forward key is present (weight 0) in a
 * rituals map. Returns a copy; never overwrites an existing entry, so a real
 * weight set later still wins. Additive at weight 0, so any weight sum is
 * unchanged and no score moves.
 */
export function ensureLifecycleParticipationRituals(
  rituals: Record<string, { weight: number; label: string }> | null | undefined
): Record<string, { weight: number; label: string }> {
  const out = { ...(rituals ?? {}) };
  if (!out[LIFECYCLE_PARTICIPATION_KEY]) {
    out[LIFECYCLE_PARTICIPATION_KEY] = { ...LIFECYCLE_PARTICIPATION_RITUAL };
  }
  return out;
}

// Streak threshold: 70%+ for a week counts toward the streak
export const STREAK_THRESHOLD = 0.7;

// Milestones — ordered highest-first for find() to return the highest matching milestone
export const MILESTONES: Array<{ weeks: number; message: string }> = [
  {
    weeks: 52,
    message: "One year of consistent drills. This is mastery.",
  },
  {
    weeks: 26,
    message:
      "Half a year. You've built something most people never do — a deliberate practice system.",
  },
  {
    weeks: 12,
    message:
      "Three months. You're not doing this for the score anymore — you're doing it because it works.",
  },
  {
    weeks: 8,
    message: "Two months. What started as points is becoming practice.",
  },
  {
    weeks: 4,
    message: "One month of drills. Habits are forming.",
  },
  {
    weeks: 2,
    message: "Two in a row. You're past the resistance phase.",
  },
  {
    weeks: 1,
    message: "First full week. The hardest part is starting.",
  },
];

export function getMilestoneMessage(weeks: number): string | null {
  return MILESTONES.find((m) => weeks >= m.weeks)?.message ?? null;
}
