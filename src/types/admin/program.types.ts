export interface AdminProgram {
  id: string;
  orgId: string;
  slug: string | null;
  name: string;
  type: "revenue" | "support";
  description: string | null;
  tpmId: string;
  lifecycleStage: "exploration" | "scaling" | "optimization" | null;
  status: string;
  client: string | null;
  memberCount: number;
  activeSprint: string | null;
  offerHypothesis?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateProgramPayload {
  name: string;
  programType: "revenue" | "support";
  description?: string;
  tpmId?: string;
  lifecycleStage?: "exploration" | "scaling" | "optimization";
  offerHypothesis?: string;
  customerProfile?: string;
}

export interface AddMemberPayload {
  userId: string;
  role?: string;
}

export interface ProgramMemberResult {
  programId: string;
  userId: string;
  role: string;
  department: string | null;
  gridPositions: unknown[];
  startDate: string;
  endDate: string | null;
  permanent: boolean;
}
