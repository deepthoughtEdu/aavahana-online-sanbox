/**
 * Type definitions for Weekly Cadence & Growth module
 */

export interface ProjectCharter {
  id: string;
  name: string;
  description: string;
  objective: string;
  kpis: string[];
  macroStrategy: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'on-hold';
  priority: 'high' | 'medium' | 'low';
}

export interface Backlog {
  id: string;
  task: string;
  projectId: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'blocked';
  reason?: string;
}

export interface LearningItem {
  id: string;
  title: string;
  description: string;
  source: string;
  dateAdded: string;
  category: 'skill' | 'process' | 'tool' | 'insight';
}

export interface Deliverable {
  id: string;
  title: string;
  projectId: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedHours: number;
  dueDate: string;
  status: 'not-started' | 'in-progress' | 'completed';
  dependencies?: string[];
  completionPercentage?: number;
  actualHours?: number;
  createdAt?: string;
}

export interface Result {
  id: string;
  deliverableId: string;
  description: string;
  metrics: string[];
  targetValue: string;
}

export interface Workflow {
  id: string;
  name: string;
  deliverableId: string;
  status: 'available' | 'to-be-created' | 'in-progress';
  owner: string;
  link?: string;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
  contingency: string;
  owner: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  deliverableId?: string;
  /** Links a block to its weekly-plan deliverable (Plan.deliverables[].id). */
  planTaskId?: string | null;
  /** Whether the linked plan task is complete (block shows done). */
  done?: boolean;
  date: string;
  startTime: string;
  endTime: string;
  type: 'work' | 'meeting' | 'review' | 'deadline' | 'high-priority';
  isHighPriority?: boolean;
  source?: 'manual' | 'recurring';
  recurringEventId?: string;
}

/** Energy reflection for a time slot — determined once per session from weekly plan input */
export type SlotEnergy = 'high' | 'medium' | 'low';

export interface EnergySlot {
  day: number; // 0 = Monday … 6 = Sunday
  startTime: string; // "HH:MM"
  endTime: string;
  energy: SlotEnergy;
}

/** Working hours per day of week (0 = Monday) */
export interface WorkingHours {
  day: number;
  startTime: string; // "HH:MM"
  endTime: string;
}

/** A deliverable that can be dragged from the deliverables tray onto the timetable */
export interface TimetableDeliverable {
  id: string;
  title: string;
  estimatedHours: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  projectName: string;
  remainingHours: number;
  /** Weekly-plan day assignment (mon..fri) when sourced from the plan. */
  day?: string | null;
}
/** High priority event categories */
export type HighPriorityCategory =
  | 'learning'
  | 'review'
  | 'wellness'
  | 'strategic'
  | 'other';
/** High priority event that can be added from any screen */
export interface HighPriorityEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  category: 'learning' | 'review' | 'wellness' | 'strategic' | 'other';
  sourceScreen?: string; // which page triggered addition
}

/** Full timetable bootstrap payload — loaded once per session */
export interface TimetableBootstrap {
  workingHours: WorkingHours[];
  energySlots: EnergySlot[];
  deliverables: TimetableDeliverable[];
  calendarEvents: CalendarEvent[];
  weekInfo: WeekInfo;
}

export interface UploadedNote {
  id: string;
  fileName: string;
  uploadDate: string;
  size: string;
  type: 'pdf' | 'doc' | 'image' | 'other';
}

export interface WeekInfo {
  startDate: string;
  endDate: string;
  weekNumber: number;
}

export interface WeeklyPlanData {
  projectCharters: ProjectCharter[];
  backlogs: Backlog[];
  learningAgenda: LearningItem[];
  deliverables: Deliverable[];
  results: Result[];
  workflows: Workflow[];
  risks: Risk[];
  calendarEvents: CalendarEvent[];
  weeklyLearningAgenda: LearningItem[];
  uploadedNotes: UploadedNote[];
  currentWeek: WeekInfo;
  timetableBootstrap?: TimetableBootstrap;
}

// ──────────────────────────────────────────────────────────────────────────────
// Service response types (previously defined locally in weekly-plan.service.ts)
// ──────────────────────────────────────────────────────────────────────────────

export interface TimeLogEntry {
  id: string;
  deliverableId: string;
  hours: number;
  date: string;
  description: string;
  deliverableName?: string;
}

export interface WeeklyReport {
  week: WeekInfo;
  summary: {
    totalProjects: number;
    activeProjects: number;
    completedDeliverables: number;
    overdueItems: number;
    totalPlannedHours: number;
    totalLoggedHours: number;
    averageCompletionRate: number;
    learningHoursThisWeek: number;
  };
  projects: { total: number; active: number; completed: number; onHold: number };
  deliverables: { total: number; completed: number; inProgress: number; overdue: number };
  learningHours: number;
  riskCount: number;
  eventsCount: number;
  generatedAt: string;
  details?: {
    projects: ProjectCharter[];
    deliverables: Deliverable[];
    backlogs: Backlog[];
    risks: Risk[];
    events: CalendarEvent[];
  };
}

export interface AiSuggestionsResponse {
  type: string;
  enhancementLevel: string;
  suggestions: string[];
  confidence: number;
  generatedAt: string;
}

export interface AiAnalysisResponse {
  entityType: string;
  entityId: string;
  analysisType: string;
  insights: string[];
  recommendations: string[];
  score: number;
  generatedAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Analytics — Value Insights
// ──────────────────────────────────────────────────────────────────────────────

/** A broad time-spend category with its company-value assessment */
export interface TimeCategory {
  /** Stable identifier, e.g. "deep-work" */
  id: string;
  /** Human-readable label, e.g. "Deep Work" */
  name: string;
  /** Actual hours logged this period */
  hours: number;
  /** Recommended weekly target hours for this category */
  targetHours: number;
  /** AI-assessed value contribution score 0–100 */
  valueScore: number;
  /** Short label for the value delivered, e.g. "Core product output" */
  valueLabel: string;
  /** Concrete description of what the company got, e.g. "2 features shipped" */
  companyImpact: string;
  /** DaisyUI semantic colour token */
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

/** A single AI-generated productivity improvement suggestion */
export interface ValueFeedbackSuggestion {
  id: string;
  title: string;
  /** Rationale and how to apply the suggestion */
  body: string;
  /** Tangible benefit e.g. "Save ~2h/week" */
  expectedImpact: string;
  priority: 'high' | 'medium' | 'low';
  /** Which category this suggestion targets, if any */
  categoryId?: string;
}

/** Full value-insights payload returned by GET /weekly-cadence/analytics/value-insights */
export interface ValueInsightsResponse {
  weekStart: string;
  totalHours: number;
  targetHours: number;
  /** AI-generated one-liner summary of the employee's week */
  valueSummary: string;
  categories: TimeCategory[];
  feedbackSuggestions: ValueFeedbackSuggestion[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Analytics — Gantt raw data
// ──────────────────────────────────────────────────────────────────────────────

export interface GanttTimeAllocation {
  category: string;
  hours: number;
}

export interface GanttDataResponse {
  _id?: string;
  weekStart: string;
  timeAllocation: GanttTimeAllocation[];
  focusRatio: number;
  untrackedHours: number;
  peakProductivity?: {
    day: string;
    focusHours: number;
  };
}
