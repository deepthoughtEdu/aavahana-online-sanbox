// ---------------------------------------------------------------------------
// Virtual Tour (Observer Tour) — frontend types
// Mirrors backend Prisma models + API response shapes
// ---------------------------------------------------------------------------

// --- Literal union types ---------------------------------------------------

export type ObserverTourStatus = "active" | "completed" | "exited";

export type ObserverCohortStatus = "scheduled" | "active" | "completed";

export type ObserverCohortRecordStatus = "scheduled" | "active" | "completed" | "archived";

export type TourContentType = "case_study" | "dt_idea" | "article" | "video";

export type TourContentDifficulty = "accessible" | "challenging" | "confronting";

export type SimulatedWorkType =
  | "daily_plan"
  | "constraint"
  | "experiment"
  | "reflection";

export type DrillName =
  | "thread_builder"
  | "gratitudes"
  | "journal"
  | "rigor"
  | "simulated_work"
  | "observer_log";

export type AssessmentDecision = "hire" | "reinvite" | "no_fit";

// --- CARR (Career Roadmap Rubric) ------------------------------------------

export type CARRDimension =
  | "execution_discipline"
  | "experimentation"
  | "capability_investment"
  | "value_chain_coordination"
  | "organisational_diagnosis";

export type CARRLevel = 1 | 2 | 3 | 4;

export const CARR_DIMENSION_LABELS: Record<CARRDimension, string> = {
  execution_discipline: "Execution Discipline",
  experimentation: "Experimentation & Org Learning",
  capability_investment: "Capability Investment",
  value_chain_coordination: "Value Chain Coordination",
  organisational_diagnosis: "Organisational Diagnosis",
};

export const CARR_LEVEL_LABELS: Record<CARRLevel, string> = {
  1: "L1 — Capable Individual",
  2: "L2 — Contributing Team Member",
  3: "L3 — System Operator",
  4: "L4 — Execution Leader",
};

export const CARR_LEVEL_SHORT: Record<CARRLevel, string> = {
  1: "Self-focused. \"I did X.\" No team/system awareness.",
  2: "Sees beyond own task AND acts on it. Helps others. Flags issues.",
  3: "Runs the process. Accountable for the group. Sets up systems, tracks, fixes.",
  4: "Makes it work in unfamiliar contexts. Methodology transfers. Earns buy-in.",
};

export const DRILL_TO_CARR: Record<Exclude<DrillName, "journal">, CARRDimension> = {
  thread_builder: "value_chain_coordination",
  gratitudes: "capability_investment",
  rigor: "experimentation",
  simulated_work: "execution_discipline",
  observer_log: "organisational_diagnosis",
};

export interface CARRDayScore {
  day: number;
  level: CARRLevel;
}

export interface CARRDimensionProgress {
  dimension: CARRDimension;
  currentLevel: CARRLevel;
  history: CARRDayScore[];
}

export interface CARRProgress {
  dimensions: CARRDimensionProgress[];
  selfAssessmentAccuracy: number | null;
}

// --- Pre-tour profile ------------------------------------------------------

export interface PreTourProfile {
  whyDT: string;
  assignmentNotes?: string;
  carrSelfAssessment?: Record<CARRDimension, CARRLevel>;
  importedAt: string;
}

// --- Observer Log (6th drill) ----------------------------------------------

export interface ObserverLogEntry {
  id: number;
  tourId: number;
  dayNumber: number;
  mentalModel: string;
  surprise: string;
  steal: string;
  createdAt: string;
  updatedAt: string;
}

// --- Self-assessment -------------------------------------------------------

export interface SelfAssessment {
  drill: DrillName;
  dayNumber: number;
  level: CARRLevel;
  reasoning: string;
}

export interface SelfAssessmentResult {
  id: number;
  tourId: number;
  drill: DrillName;
  dayNumber: number;
  selfLevel: CARRLevel;
  selfReasoning: string;
  systemLevel: CARRLevel | null;
  createdAt: string;
}

// --- Growth mirror (Day 1 vs Day 6) ---------------------------------------

export interface GrowthMirrorResponse {
  preTourProfile: PreTourProfile | null;
  day6Reflection: string | null;
  carrStart: Record<CARRDimension, CARRLevel | null>;
  carrEnd: Record<CARRDimension, CARRLevel | null>;
}

// --- Personalized mission signal -------------------------------------------

export interface PersonalizedSignal {
  left: { label: string; value: string; tone: "red" | "green" | "neutral" };
  right: { label: string; value: string; tone: "red" | "green" | "neutral" };
  punchline: string;
  tag?: string;
  source?: "generic" | "personalized";
}

// --- Drill escalation config -----------------------------------------------

export interface DrillEscalation {
  dayNumber: number;
  prompt: string;
  constraints?: string[];
  addedFields?: string[];
}

// --- JSON sub-types --------------------------------------------------------

export interface GratitudeEntry {
  statement: string;
  reason: string;
  rigor?: string;
  score?: number;
}

export interface SEMoments {
  observe: string;
  hypothesis: string;
  question: string;
}

// --- Entity interfaces (match Prisma models) --------------------------------

export interface ObserverCohort {
  id: number;
  orgId: string;
  name: string;
  startDate: string;
  totalDays: number;
  status: ObserverCohortStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ObserverCohortRecord {
  id: number;
  orgId: string;
  name: string;
  startDate: string;
  totalDays: number;
  status: ObserverCohortRecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ObserverTour {
  id: number;
  eid: number;
  orgId: string;
  startDate: string;
  totalDays: number;
  currentDay: number;
  status: ObserverTourStatus;
  cohortId: number | null;
  preTourProfile: PreTourProfile | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadBuilderSession {
  id: number;
  tourId: number;
  dayNumber: number;
  sessionName: string | null;
  content: string;
  charCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GratitudeDay {
  id: number;
  tourId: number;
  dayNumber: number;
  entries: GratitudeEntry[];
  avgScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpatialJournal {
  id: number;
  tourId: number;
  sheetData: Record<string, unknown>;
  updatedAt: string;
}

export interface RigorEntry {
  id: number;
  tourId: number;
  dayNumber: number;
  contentId: number | null;
  statement: string;
  reason: string;
  rigor: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulatedWork {
  id: number;
  tourId: number;
  dayNumber: number;
  workType: SimulatedWorkType;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TourContent {
  id: number;
  orgId: string;
  title: string;
  contentType: TourContentType;
  story: string;
  gridMapping: Record<string, unknown>;
  seMoments: SEMoments;
  servantLeadership: string | null;
  openQuestion: string | null;
  difficulty: TourContentDifficulty;
  createdAt: string;
  updatedAt: string;
}

export interface TourDayContent {
  id: number;
  orgId: string;
  dayNumber: number;
  contentId: number;
  cohortId: number | null;
}

export interface FeedbackPromptTemplate {
  id: number;
  orgId: string;
  drill: DrillName;
  dayNumber: number;
  template: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackTakeaway {
  id: number;
  tourId: number;
  drill: DrillName;
  dayNumber: number;
  takeaway: string;
  createdAt: string;
}

export interface AssessmentNote {
  id: number;
  tourId: number;
  authorUid: string;
  content: string;
  decision: AssessmentDecision | null;
  createdAt: string;
  updatedAt: string;
}

// --- API response composites -----------------------------------------------

export interface DayDrills {
  threadBuilder: { done: boolean; charCount: number };
  gratitudes: { done: boolean; avgScore: number | null };
  journal: { done: boolean };
  rigor: { done: boolean; entryCount: number };
  simulatedWork: { done: boolean };
  observerLog: { done: boolean };
}

export interface AttendanceStatus {
  marked: boolean;
  method: "passkey" | "admin_override" | null;
  passkeyExists: boolean;
}

export interface DayViewResponse {
  currentDay: number;
  totalDays: number;
  status: ObserverTourStatus;
  cohortId: number | null;
  content: TourContent | null;
  drills: DayDrills;
  carrProgress: CARRProgress | null;
  escalation: Partial<Record<DrillName, DrillEscalation>> | null;
  preTourProfile: PreTourProfile | null;
  isDay6: boolean;
  attendance?: AttendanceStatus;
}

export interface DashboardDay {
  dayNumber: number;
  required: string[];
  completed: Record<string, boolean>;
  attendance: AttendanceStatus;
}

export interface DashboardResponse {
  tourId: number;
  status: ObserverTourStatus;
  currentDay: number;
  totalDays: number;
  days: DashboardDay[];
}

export interface TourAttendanceRecord {
  id: number;
  tourId: number;
  dayNumber: number;
  method: "passkey" | "admin_override";
  markedAt: string;
}

export interface FeedbackPastebackRecord {
  id: number;
  tourId: number;
  drill: string;
  dayNumber: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalReflectionRecord {
  id: number;
  tourId: number;
  dayNumber: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CohortDashboardResponse {
  eid: number;
  name: string;
  tourId: number;
  status: ObserverTourStatus;
  currentDay: number;
  totalDays: number;
  cohortId: number | null;
  drillCompletions: {
    threadBuilder: number;
    gratitudes: number;
    rigor: number;
    simulatedWork: number;
    observerLog: number;
  };
  totalChars: number;
  avgGratitudeScore: number | null;
  totalTakeaways: number;
  carrProgress: CARRProgress | null;
}

export interface FeedbackPromptResponse {
  promptText: string;
}

export interface WhyDtResponse {
  id: number;
  tourId: number;
  orgId: string;
  responses: Record<string, string>;
  submittedAt: string;
  updatedAt: string;
}

export interface AdtechPrepResponse {
  id: number;
  eid: number;
  orgId: string;
  responses: Record<string, string>;
  submittedAt: string;
  updatedAt: string;
}

export interface PracticeModuleResponse {
  id: number;
  tourId: number;
  moduleSlug: string;
  orgId: string;
  responses: Record<string, string>;
  submittedAt: string;
  updatedAt: string;
}

export interface ObserverDeepView {
  tour: ObserverTour;
  employee: { eid: number; name: string; email: string };
  threadBuilderSessions: ThreadBuilderSession[];
  gratitudeDays: GratitudeDay[];
  spatialJournal: SpatialJournal | null;
  rigorEntries: RigorEntry[];
  simulatedWork: SimulatedWork[];
  observerLogs: ObserverLogEntry[];
  feedbackTakeaways: FeedbackTakeaway[];
  assessmentNotes: AssessmentNote[];
  selfAssessments: SelfAssessmentResult[];
  carrProgress: CARRProgress | null;
  whyDtResponse: WhyDtResponse | null;
}

export interface ObserverComparisonResponse {
  observer: ObserverDeepView;
  day1: Record<string, unknown>;
  dayN: Record<string, unknown>;
}

export interface LeaderboardEntry {
  eid: number;
  name: string;
  totalChars: number;
  sessionCount: number;
}

// --- Challenges ------------------------------------------------------------

export interface ChallengeListItem {
  id: number;
  slug: string;
  title: string;
  summary: string;
  difficulty: string;
  attempt: { id: number; status: string; updatedAt: string } | null;
}

export interface ChallengeDetail extends ChallengeListItem {
  content: string;
  attempt: { id: number; status: string; response: string | null; updatedAt: string } | null;
}

// --- Mutation payloads -----------------------------------------------------

export interface CreateCohortPayload {
  name: string;
  startDate: string;
  totalDays?: number;
}

export interface CreateTourPayload {
  eid: number;
  startDate: string;
  totalDays?: number;
  cohortId?: number;
}

export interface SubmitThreadBuilderPayload {
  dayNumber: number;
  sessionName?: string;
  content: string;
}

export interface SubmitGratitudePayload {
  dayNumber: number;
  entries: GratitudeEntry[];
}

export interface SaveSpatialJournalPayload {
  sheetData: Record<string, unknown>;
}

export interface RigorEntryInput {
  statement: string;
  reason: string;
  rigor: string;
}

export interface SubmitRigorPayload {
  dayNumber: number;
  contentId?: number;
  entries: RigorEntryInput[];
}

export interface SubmitSimulatedWorkPayload {
  dayNumber: number;
  workType: SimulatedWorkType;
  data: Record<string, unknown>;
}

export interface SubmitFeedbackTakeawayPayload {
  drill: DrillName;
  dayNumber: number;
  takeaway: string;
}

export interface CreateAssessmentNotePayload {
  content: string;
  decision?: AssessmentDecision;
}

export interface CreateTourContentPayload {
  title: string;
  contentType: TourContentType;
  story: string;
  gridMapping: Record<string, unknown>;
  seMoments: SEMoments;
  servantLeadership?: string;
  openQuestion?: string;
  difficulty: TourContentDifficulty;
}

export interface AssignDayContentPayload {
  dayNumber: number;
  contentId: number;
  cohortId?: number;
}

export interface CreateFeedbackTemplatePayload {
  drill: DrillName;
  dayNumber: number;
  template: string;
}

// --- New mutation payloads -------------------------------------------------

export interface SubmitObserverLogPayload {
  dayNumber: number;
  mentalModel: string;
  surprise: string;
  steal: string;
}

export interface SubmitSelfAssessmentPayload {
  drill: DrillName;
  dayNumber: number;
  level: CARRLevel;
  reasoning: string;
}

export interface SubmitDay6ReflectionPayload {
  reflection: string;
}

export interface SavePreTourProfilePayload {
  whyDT: string;
  assignmentNotes?: string;
  carrSelfAssessment?: Record<CARRDimension, CARRLevel>;
}

// --- Self Gratitude Activities -----------------------------------------------

export interface SelfGratitudeActivity {
  id: number;
  tourId: number;
  activityId: number;
  choices: Record<string, unknown>;
  score: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitSelfGratitudePayload {
  activityId: number;
  choices: Record<string, unknown>;
  score?: Record<string, unknown>;
}

export interface MyTourStatus {
  enrolled: boolean;
  tourId?: number;
  status?: string;
  currentDay?: number;
  totalDays?: number;
  startDate?: string;
  cohortId?: number | null;
}
