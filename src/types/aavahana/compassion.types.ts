export type SupportStepId =
  | "request_decision" | "independent_task" | "protect_focus" | "ask_for_help"
  | "move_one_task" | "smallest_step" | "clarify_expectation" | "quiet_pause";

export interface SupportMessage { role: "user" | "assistant"; text: string }
export interface SupportStep {
  id: SupportStepId;
  label: string;
  instruction: string;
  draft?: string;
}

/** What the support chat gets back for one message. */
export interface SupportReply {
  reply: string;
  /**
   * True when the person described being in danger. The reply is then a fixed
   * safety message written by the app, never anything the model wrote.
   */
  urgent: boolean;
  /**
   * True when they asked for help filling in their report. Only sent to a
   * screen that offered the report helper, which then opens it.
   */
  reportHelp?: boolean;
}

export interface SupportPayload {
  message: string;
  /** Earlier turns, role and text only. The backend accepts at most 10. */
  history: SupportMessage[];
  allowAi: true;
  /** This screen can open the report helper, so asking for one may open it. */
  offerReportHelp?: boolean;
  apiKey?: string;
  provider?: string;
  model?: string;
}
export interface SupportFollowUp {
  id: string;
  stepId: SupportStepId;
  step: SupportStep;
  dueAt: string;
}
export interface SupportFollowUpResponse { followUp: SupportFollowUp | null }
export interface SupportRememberPayload {
  stepId: SupportStepId;
  dueAt: string;
  remember: true;
}
export type SupportOutcome = "helped" | "not_helpful" | "not_tried" | "dismissed";
