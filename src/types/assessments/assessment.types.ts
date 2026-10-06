export interface AssessmentInstanceResponse {
  id: number;
  orgId: string;
  uid: number;
  eid: number | null;
  contextType: string;
  contextId: number;
  schemaKey: string;
  status: "in_progress" | "completed" | "scored";
  aggregateScore: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  responses?: AssessmentResponseRecord[];
}

export interface AssessmentResponseRecord {
  id: number;
  instanceId: number;
  activityId: number;
  choices: Record<string, unknown>;
  explanation: string | null;
  score: Record<string, unknown> | null;
  llmFeedback: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface FindOrCreatePayload {
  contextType?: string;
  contextId?: number;
  schemaKey: string;
  metadata?: Record<string, unknown>;
}

export interface SubmitResponsePayload {
  activityId: number;
  choices: Record<string, unknown>;
  explanation?: string;
}

export interface FindOrCreateResult {
  instance: AssessmentInstanceResponse;
  created: boolean;
}
