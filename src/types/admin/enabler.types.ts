export type EnablerType = "core" | "native" | "custom";

export interface Enabler {
  id: number;
  orgId: string;
  key: string;
  name: string;
  description?: string | null;
  type: EnablerType;
  enabled: boolean;
  renderIn: string[] | null;
  trackParticipation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnablerPayload {
  key?: string;
  name: string;
  description?: string;
  type?: EnablerType;
  enabled?: boolean;
  renderIn?: string[];
  trackParticipation?: boolean;
}

export interface UpdateEnablerPayload {
  name?: string;
  description?: string;
  type?: EnablerType;
  enabled?: boolean;
  renderIn?: string[];
  trackParticipation?: boolean;
}

export interface EnablerEvent {
  id: number;
  enablerId: number;
  orgId: string;
  userId: string;
  eventType: string;
  programId: number | null;
  weekId: string | null;
  createdAt: string;
}
