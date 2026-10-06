export type LabelType = "deliverable" | "ip" | "kpi" | "framework" | "process" | "ritual";

export type LabelStatus = "active" | "pending" | "retired";

export interface AdminLabel {
  id: number;
  orgId: string;
  name: string;
  key: string;
  type: LabelType;
  status: LabelStatus;
  category?: string;
  levelTag?: string;
  horizontalTag?: string;
  cellRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabelPayload {
  name: string;
  key?: string;
  type: LabelType;
  category?: string;
  levelTag?: string;
  horizontalTag?: string;
  cellRef?: string;
}
