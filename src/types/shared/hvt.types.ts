/**
 * HVT (High-Value Test) Types — Shared between Mimamsaka (L3) and Aavahana (L1/L2)
 *
 * The micro-experimentation engine behind Business Process R&D (SSOT Part 0 §A).
 * One backend, two middlewares — role-based access controls which endpoints are available.
 */

// ─── Enums ──────────────────────────────────────────────────────────────────────

export type ExperimentStatus = "idea" | "planned" | "running" | "concluded" | "cancelled";
export type WinnerOutcome    = "A" | "B" | "inconclusive" | "cancelled";
export type IdeaStatus       = "submitted" | "accepted" | "rejected" | "converted";

// ─── Experiment Core ────────────────────────────────────────────────────────────

export interface ExperimentVariant {
  label:       string;
  description: string;
}

export interface ExperimentResult {
  variantAOutcome: string;
  variantBOutcome: string;
  winner:          WinnerOutcome;
  delta:           string;
  significance:    string;
}

export interface HVTExperiment {
  id:              string;
  programId:       string;
  programName:     string;
  programSlug:     string;
  sprintId:        string | null;
  sprintNumber:    number | null;

  title:           string;
  hypothesis:      string;
  successCase:     string;
  northStarRef?:   string;

  variantA:        ExperimentVariant;
  variantB:        ExperimentVariant;

  status:          ExperimentStatus;
  result?:         ExperimentResult;
  learning?:       string;

  cellRef?:        string;

  createdBy:       string;
  assignedTo?:     string;
  tags:            string[];

  createdAt:       string;
  plannedAt?:      string;
  startedAt?:      string;
  concludedAt?:    string;
  updatedAt:       string;

  linkedIpId?:     string;
}

// ─── Experiment Idea (L1/L2 Contribution) ───────────────────────────────────────

export interface ExperimentIdea {
  id:              string;
  programId:       string;
  programName:     string;

  title:           string;
  hypothesis:      string;
  suggestedVariantA?: string;
  suggestedVariantB?: string;
  rationale:       string;
  cellRef?:        string;

  status:          IdeaStatus;
  submittedBy:     string;
  submittedByName: string;
  reviewedBy?:     string;
  reviewNote?:     string;
  convertedToExperimentId?: string;

  createdAt:       string;
  reviewedAt?:     string;
}

export interface SubmitIdeaPayload {
  programId:         string;
  title:             string;
  hypothesis:        string;
  suggestedVariantA?: string;
  suggestedVariantB?: string;
  rationale:         string;
  cellRef?:          string;
}

// ─── Aggregation Types ──────────────────────────────────────────────────────────

export interface ProgramHVTSummary {
  programId:          string;
  programName:        string;
  programSlug:        string;
  programType:        "revenue" | "support";
  totalExperiments:   number;
  byStatus: {
    idea:       number;
    planned:    number;
    running:    number;
    concluded:  number;
    cancelled:  number;
  };
  winRate:            number;
  searchSpaceNarrowed: number;
  activeSprint?:      string;
  activeSprintNumber?: number;
}

export interface HVTExplorerOverview {
  totalPrograms:      number;
  totalExperiments:   number;
  totalConcluded:     number;
  totalRunning:       number;
  overallWinRate:     number;
  overallSearchSpace: number;
  programs:           ProgramHVTSummary[];
}

export interface HVTTimelineEntry {
  experimentId:    string;
  experimentTitle: string;
  programId:       string;
  programName:     string;
  sprintNumber:    number | null;
  status:          ExperimentStatus;
  date:            string;
  event:           "created" | "planned" | "started" | "concluded" | "cancelled";
}

// ─── Filter & Pagination ────────────────────────────────────────────────────────

export interface HVTFilterParams {
  programId?:  string;
  sprintId?:   string;
  status?:     ExperimentStatus;
  cellRef?:    string;
  assignedTo?: string;
  search?:     string;
  page?:       number;
  limit?:      number;
  sortBy?:     "createdAt" | "updatedAt" | "concludedAt" | "status";
  sortOrder?:  "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data:       T[];
  pagination: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

// ─── L3 CRUD Payloads ───────────────────────────────────────────────────────────

export interface CreateExperimentPayload {
  programId:      string;
  sprintId?:      string;
  title:          string;
  hypothesis:     string;
  successCase:    string;
  northStarRef?:  string;
  variantA:       ExperimentVariant;
  variantB:       ExperimentVariant;
  cellRef?:       string;
  assignedTo?:    string;
  tags?:          string[];
}

export interface UpdateExperimentPayload {
  title?:         string;
  hypothesis?:    string;
  successCase?:   string;
  northStarRef?:  string;
  variantA?:      ExperimentVariant;
  variantB?:      ExperimentVariant;
  cellRef?:       string;
  assignedTo?:    string;
  tags?:          string[];
  sprintId?:      string;
}

export interface ConcludeExperimentPayload {
  experimentId:   string;
  result:         ExperimentResult;
  learning:       string;
}

export interface CancelExperimentPayload {
  experimentId:   string;
  reason:         string;
}

export interface LinkToIpPayload {
  experimentId:   string;
  ipItemId:       string;
}

export interface ReviewIdeaPayload {
  ideaId:         string;
  action:         "accept" | "reject";
  reviewNote?:    string;
}

// ─── Sprint Experiment Slots (L3) ───────────────────────────────────────────────

export interface SprintExperimentSlot {
  sprintId:       string;
  sprintNumber:   number;
  startDate:      string;
  endDate:        string;
  experiments:    HVTExperiment[];
  capacity:       number;
}

// ─── L1/L2 View Types ───────────────────────────────────────────────────────────

export interface MyProgramsHVTOverview {
  programs:           ProgramHVTSummary[];
  totalExperiments:   number;
  totalRunning:       number;
  totalConcluded:     number;
}

export interface MyIdeasListItem {
  id:           string;
  programId:    string;
  programName:  string;
  title:        string;
  status:       IdeaStatus;
  reviewNote?:  string;
  convertedToExperimentId?: string;
  createdAt:    string;
  reviewedAt?:  string;
}

// ─── L2 Team Summary ────────────────────────────────────────────────────────────

export interface TeamHVTSummary {
  directReportId:   string;
  directReportName: string;
  programs: Array<{
    programId:        string;
    programName:      string;
    runningCount:     number;
    concludedCount:   number;
    assignedToMember: number;
  }>;
}
