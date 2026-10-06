// ─── Talking Document Types ───────────────────────────────────────────────────
// Spec References: A115–A123
// Shared across Mimamsaka and Niyanta modules.

export type Vertical   = "V4" | "V5";
export type Horizontal = "H1" | "H2" | "H3" | "H4" | "H5";

export type TalkingDocType =
  | "new_hire"
  | "market_entry"
  | "product_launch"
  | "operational_redesign"
  | "quarterly_review"
  | "osd"
  | "role_success"
  | "margin_improvement";

export type TalkingDocStatus = "draft" | "published" | "archived";
export type AuthorRole       = "leadership" | "dt_advisor" | "external_advisor";
export type ActiveLoop       = "forward" | "backward";

// ─── Grid Cell ────────────────────────────────────────────────────────────────

export interface CellMetrics {
  planned:  string;
  actual:   string;
  gap?:     string;
}

export interface L3NavigationLink {
  cellKey:          string;       // e.g. "V5_H1"
  targetType:       "micromap" | "event_loop" | "constraint_heatmap";
  targetProgramId:  string;
  targetId:         string;
  programLabel?:    string;       // Human-readable program name
  insight?:         string;       // Key finding / data point
}

export interface GridCell {
  vertical:          Vertical;
  horizontal:        Horizontal;
  forwardContent:    string;      // Offer→Order perspective (read H1→H5)
  backwardContent:   string;      // Order→Offer perspective (read H5→H1)
  linkedProgramIds:  string[];
  linkedL3Views:     L3NavigationLink[];
  metrics?:          CellMetrics; // Optional: planned vs actual for V5 cells
}

// ─── Interaction Logging (A121) ───────────────────────────────────────────────

export interface InteractionLog {
  _id:                 string;
  documentId:          string;
  questionText:        string;
  cellKey:             string;
  functionsCalled:     string[];
  programsReferenced:  string[];
  timestamp:           string;
}

// ─── Talking Document ─────────────────────────────────────────────────────────

export interface TalkingDocument {
  _id:                  string;
  title:                string;
  type:                 TalkingDocType;
  orgId:                string;
  createdBy:            string;
  authorRole:           AuthorRole;
  authorName?:          string;           // Human-readable author name
  authorTitle?:         string;           // Role title (e.g. "CEO")
  cells:                GridCell[];       // 10 cells: V5×H1-H5 + V4×H1-H5
  linkedProgramIds:     string[];
  linkedProgramLabels?: string[];         // Human-readable program names
  status:               TalkingDocStatus;
  interactionLogs:      InteractionLog[];
  createdAt:            string;
  updatedAt:            string;
}

export interface TalkingDocSummary {
  _id:               string;
  title:             string;
  type:              TalkingDocType;
  status:            TalkingDocStatus;
  linkedProgramIds:  string[];
  createdBy:         string;
  createdAt:         string;
}

// ─── CoPilot ──────────────────────────────────────────────────────────────────

export interface CoPilotMessage {
  _id:                 string;
  documentId:          string;
  cellKey:             string;
  role:                "user" | "assistant";
  content:             string;
  functionsCalled:     string[];
  programsReferenced:  string[];
  timestamp:           string;
}

export interface CoPilotSession {
  documentId:        string;
  messages:          CoPilotMessage[];
  apiKeyConfigured:  boolean;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateTalkingDocPayload {
  title:             string;
  type:              TalkingDocType;
  linkedProgramIds:  string[];
  cells:             GridCell[];
}

export interface UpdateTalkingDocPayload {
  title?:            string;
  type?:             TalkingDocType;
  linkedProgramIds?: string[];
  cells?:            GridCell[];
  status?:           TalkingDocStatus;
}

export interface UpdateCellPayload {
  forwardContent?:   string;
  backwardContent?:  string;
  linkedProgramIds?: string[];
  linkedL3Views?:    L3NavigationLink[];
}

export interface CoPilotQueryPayload {
  question:  string;
  cellKey:   string;
  apiKey:    string;
}

export interface CoPilotQueryResponse {
  answer:              string;
  functionsCalled:     string[];
  programsReferenced:  string[];
}
