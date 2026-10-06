/** Career Runrate — three graph trajectories */
export interface TrajectoryPoint {
  date:  string;   // YYYY-MM-DD snapshot
  score: number;   // 0–100
  level: string;   // level key at this point
}

export interface CareerRunrate {
  eid:            number;
  ladderId:       string;
  planned:        TrajectoryPoint[];  // AI-suggested → supervisor-edited at onboarding
  actual:         TrajectoryPoint[];  // calculated from 6-axis scores, append-only
  projected:      TrajectoryPoint[];  // regression extrapolation, checked vs level eligibility
  lastCalculated: string;
}

/** Health Score — system-computed composite */
export interface HealthScore {
  eid:            number;
  compositeScore: number;   // 0–100 weighted composite
  components: {
    capability:   number;
    contribution: number;
    ubs:          number;
    supScore:     number;
    lifecycle:    number;   // W3.2 — IO progression (progression-weighted, not volume)
  };
  weights: {
    capability:   number;
    contribution: number;
    ubs:          number;
    supScore:     number;
    lifecycle:    number;   // default 0.40 of composite (NEEDS-TARUN); renormalizes the other four
  };
  createdAt: string;
}

/** UBS — Unicorn Behavior Score (ritual participation) */
export interface UBSRecord {
  eid:        number;
  weekId:     string;    // "2026-W10"
  score:      number;    // weighted sum of ritual participation
  rituals:    { ritualKey: string; participated: boolean; weight: number }[];
}

/** Sup Score — bidirectional feedback aggregate */
export interface SupScoreAggregate {
  managerId:    string;
  periodWeeks:  number;
  composite:    number;          // 1–10
  distribution: number[];        // histogram [count for score 1, 2, …, 10]
  weeklyTrend:  { weekId: string; avg: number }[];
  rubricBreakdown: { dimension: string; avg: number }[];
  respondentCount: number;
}

/** Team timesheet analytics */
export interface TeamTimesheetWeek {
  eid:          number;
  employeeName: string;
  weekId:       string;
  operational:     number;
  research:        number;
  deepWork:        number;
  coordination:    number;
  meetings:        number;
  planningStrategy: number;
  totalMinutes:    number;
}

export interface TeamAnalytics {
  supervisorId: string;
  weeks:        TeamTimesheetWeek[];
}
