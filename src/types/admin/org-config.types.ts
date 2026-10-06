export interface OrgColorScheme {
  primary: string;
  secondary?: string;
  accent?: string;
}

export interface CareerLevel {
  level: "V1" | "V2" | "V3" | "V4" | "V5";
  name: string;
  criteria?: string;
}

export interface CareerLadder {
  id: string;
  name: string;
  levels: CareerLevel[];
}

export interface HealthScoreWeights {
  capability: number;
  contribution: number;
  ubs: number;
  supScore: number;
}

export interface NotificationRule {
  event: string;
  channels: ("in_app" | "email" | "push")[];
  leadTimeMinutes?: number;
  thresholdHours?: number;
  immediate?: boolean;
}

export interface GoverningQuestion {
  cell: string;
  question: string;
}

export interface UbsWeight {
  ritualLabelId: number;
  weight: number;
}

export interface ScoringCriterion {
  criterion: string;
  weight: number;
}

export interface SupScoringRubric {
  l2_to_l1: ScoringCriterion[];
  l1_to_l2: ScoringCriterion[];
}

export interface EscalationTier {
  level: number;
  afterMissedCount: number;
  target: string;
}

export interface EscalationSourcePolicy {
  enabled: boolean;
  reminderUntilMiss?: number;
  levels?: EscalationTier[];
  maxLevels?: number;
  digest?: boolean;
}

export interface EscalationPolicy {
  daily_report?: EscalationSourcePolicy;
  attendance_weekly?: EscalationSourcePolicy;
  /**
   * Monthly attendance rollup to the org head. Off by default: the backend
   * default is { enabled: false }, and the cron skips every org that has not
   * explicitly turned it on.
   */
  attendance_monthly?: EscalationSourcePolicy;
}

export interface OrgConfig {
  id: number;
  orgId: string;
  name: string;
  logo: string | null;
  colorScheme: OrgColorScheme | null;
  ladders: CareerLadder[];
  healthScoreWeights: HealthScoreWeights;
  healthScoreComponents: Record<string, unknown> | null;
  reportDeadlines: { daily: string; weekly: string; monthly: string };
  dailyGracePeriod: boolean;
  nonComplianceThreshold: number | null;
  escalationTargets: string[] | null;
  ubsWeights: UbsWeight[] | Record<string, never>;
  supScoringRubric: SupScoringRubric;
  supScoringCadence: string | null;
  workingDays: number[];
  notificationRules: NotificationRule[];
  enabledEnablers: string[];
  governingQuestions: GoverningQuestion[];
  defaultModuleAccess: string[] | null;
  defaultTokenQuota: number | null;
  byokEnabled: boolean;
  escalationPolicy: EscalationPolicy | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateIdentityPayload {
  name: string;
  logo?: string;
  colorScheme?: OrgColorScheme;
}

export interface UpdateLaddersPayload {
  ladders: CareerLadder[];
}

export interface UpdateWorkingDaysPayload {
  workingDays: number[];
}

export interface UpdateHealthWeightsPayload {
  healthScoreWeights: HealthScoreWeights;
}

export interface UpdateNotificationsPayload {
  notificationRules: NotificationRule[];
}

export interface UpdateGoverningQuestionsPayload {
  governingQuestions: GoverningQuestion[];
}

export interface UpdateScoringPayload {
  ubsWeights: UbsWeight[];
  supScoringRubric: SupScoringRubric;
}

export interface UpdateEnablersPayload {
  enabledEnablers: string[];
}

export interface UpdateReportDeadlinesPayload {
  daily: string;
  weekly: string;
  monthly: string;
}
