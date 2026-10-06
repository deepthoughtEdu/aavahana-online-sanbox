import type {
  PlannedDeliverable,
  Dictionary,
  Prompts,
  FeedbackSignals,
} from "./types";
export { MOCK_NESTED_NAVIGATIONS } from "./mockNavigations";

// ── Deliverables — from employee's assigned grid slots ──

export const MOCK_PLANNED_DELIVERABLES: PlannedDeliverable[] = [
  { id: 1, gridSlot: "V2-H3", label: "API Integration", estimateMins: 120, actualMins: 0, isCriticalPath: false, status: null, qaStatus: null },
  { id: 2, gridSlot: "V2-H1", label: "Login Page UI", estimateMins: 60, actualMins: 0, isCriticalPath: false, status: null, qaStatus: null },
  { id: 3, gridSlot: "V3-H2", label: "Deploy Script", estimateMins: 30, actualMins: 0, isCriticalPath: false, status: null, qaStatus: null },
];

// ── Constraint 5×5 dictionary (from SSOT: constraints-navigation-hierarchy.tsv) ──

export const MOCK_CONSTRAINTS: Dictionary = {
  macro: [
    { id: "budget", label: "Budget" },
    { id: "talent", label: "Talent" },
    { id: "internal_support", label: "Internal Support" },
    { id: "assumptions", label: "Assumptions" },
    { id: "permissions", label: "Permissions" },
  ],
  micro: {
    budget: [
      { id: "1.1", label: "Insufficient hours allocated" },
      { id: "1.2", label: "Tools or licenses unavailable" },
      { id: "1.3", label: "No budget for external help" },
      { id: "1.4", label: "Competing priorities ate the budget" },
      { id: "1.5", label: "Rework consumed allocated time" },
    ],
    talent: [
      { id: "2.1", label: "Skill gap in the task area" },
      { id: "2.2", label: "Learning curve on new tool/tech" },
      { id: "2.3", label: "No expert available to consult" },
      { id: "2.4", label: "Understaffed for the workload" },
      { id: "2.5", label: "Team stretched across too many tasks" },
    ],
    internal_support: [
      { id: "3.1", label: "Stakeholder unresponsive" },
      { id: "3.2", label: "Unclear ownership" },
      { id: "3.3", label: "Cross-team coordination gap" },
      { id: "3.4", label: "Unclear specs or knowledge transfer" },
      { id: "3.5", label: "Conflicting priorities from leadership" },
    ],
    assumptions: [
      { id: "4.1", label: "Market conditions shifted" },
      { id: "4.2", label: "Regulatory or compliance change" },
      { id: "4.3", label: "Client changed direction" },
      { id: "4.4", label: "Vendor or third-party failed" },
      { id: "4.5", label: "Technology landscape shifted" },
    ],
    permissions: [
      { id: "5.1", label: "Budget not yet sanctioned" },
      { id: "5.2", label: "Contractual or legal restriction" },
      { id: "5.3", label: "Data or system access not granted" },
      { id: "5.4", label: "No mandate to act" },
      { id: "5.5", label: "Waiting on external clearance" },
    ],
  },
};

// ── Navigation — now generated from SSOT (see tools/generate-nav-data.js) ──
// MOCK_NESTED_NAVIGATIONS is re-exported from mockNavigations.ts above.

// ── Framework dictionary (from SSOT: practice-ontology-frameworks.tsv) ──
// Macros = horizontals (H1-H5). Micros = 5 representative frameworks per horizontal.

export const MOCK_FRAMEWORKS: Dictionary = {
  macro: [
    { id: "H1", label: "Amplify (Orders)" },
    { id: "H2", label: "Delight (Experience)" },
    { id: "H3", label: "Deliver (Capacity)" },
    { id: "H4", label: "Develop (Capability)" },
    { id: "H5", label: "Decide (Offers)" },
  ],
  micro: {
    H1: [
      { id: "H1F1", label: "Customer Development" },
      { id: "H1F2", label: "Inbound Marketing" },
      { id: "H1F3", label: "Challenger Sale" },
      { id: "H1F4", label: "Land and Expand" },
      { id: "H1F5", label: "Product-Led Growth (PLG)" },
    ],
    H2: [
      { id: "H2F1", label: "Service-Dominant Logic (SDL)" },
      { id: "H2F2", label: "Emotional Intelligence" },
      { id: "H2F3", label: "ITIL (IT Infrastructure Library)" },
      { id: "H2F4", label: "Net Promoter System (NPS)" },
      { id: "H2F5", label: "Relationship Marketing" },
    ],
    H3: [
      { id: "H3F1", label: "Toyota Production System (TPS)" },
      { id: "H3F2", label: "Lean Thinking" },
      { id: "H3F3", label: "Total Productive Maintenance (TPM)" },
      { id: "H3F4", label: "Factory Physics" },
      { id: "H3F5", label: "High Reliability Organizations (HRO)" },
    ],
    H4: [
      { id: "H4F1", label: "Technology Readiness Levels (TRL)" },
      { id: "H4F2", label: "APQP (Advanced Product Quality Planning)" },
      { id: "H4F3", label: "Theory of Constraints" },
      { id: "H4F4", label: "PDCA (Plan-Do-Check-Act)" },
      { id: "H4F5", label: "CMMI (Capability Maturity Model Integration)" },
    ],
    H5: [
      { id: "H5F1", label: "PESTEL" },
      { id: "H5F2", label: "Ansoff Matrix" },
      { id: "H5F3", label: "Blue Ocean Strategy" },
      { id: "H5F4", label: "Porter's Five Forces" },
      { id: "H5F5", label: "Business Model Canvas" },
    ],
  },
};

// ── Feelings 5×5 dictionary ──

export const MOCK_FEELINGS: Dictionary = {
  macro: [
    { id: "1", label: "Energized" },
    { id: "2", label: "Good" },
    { id: "3", label: "Neutral" },
    { id: "4", label: "Drained" },
    { id: "5", label: "Overwhelmed" },
  ],
  micro: {
    "1": [
      { id: "1.1", label: "Vitality" },
      { id: "1.2", label: "Command" },
      { id: "1.3", label: "Traction" },
      { id: "1.4", label: "Uplift" },
      { id: "1.5", label: "Resonance" },
    ],
    "2": [
      { id: "2.1", label: "Balance" },
      { id: "2.2", label: "Ease" },
      { id: "2.3", label: "Stride" },
      { id: "2.4", label: "Rapport" },
      { id: "2.5", label: "Alignment" },
    ],
    "3": [
      { id: "3.1", label: "Flat" },
      { id: "3.2", label: "Passive" },
      { id: "3.3", label: "Drift" },
      { id: "3.4", label: "Distant" },
      { id: "3.5", label: "Routine" },
    ],
    "4": [
      { id: "4.1", label: "Depleted" },
      { id: "4.2", label: "Reactive" },
      { id: "4.3", label: "Futility" },
      { id: "4.4", label: "Burdened" },
      { id: "4.5", label: "Hollow" },
    ],
    "5": [
      { id: "5.1", label: "Burnout" },
      { id: "5.2", label: "Trapped" },
      { id: "5.3", label: "Sinking" },
      { id: "5.4", label: "Isolated" },
      { id: "5.5", label: "Fractured" },
    ],
  },
};

// ── Prompts ──

export const MOCK_PROMPTS: Prompts = {
  act1: {
    initial: "Your day",
  },
  act2: {
    initial: "What would have enabled you to perform even better today?",
    voiceTemplate:
      "You faced {constraintMicro} and used {navigationMicro} — tell us the story",
  },
  act3: {
    frameworkPrompt: "What did you practice today?",
    feelingPrompt: "How are you feeling?",
  },
};

// ── Feedback signals (hardcoded for prototype) ──

export const MOCK_FEEDBACK: FeedbackSignals = {
  constraintPersistence: { type: "Talent", count: 3, days: 4 },
  navigationVariety: { count: 2 },
  streak: 7,
  points: 8,
};
