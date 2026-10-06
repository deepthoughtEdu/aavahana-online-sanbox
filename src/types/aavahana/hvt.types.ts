export interface HVTExperiment {
  id: string;
  programId: string;
  sprintId: string;
  hypothesis: string;
  successCriteria: string;
  variantA: string;
  variantB?: string;
  result?: "success" | "failure" | "inconclusive";
  resultNotes?: string;
  status: "planned" | "active" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface CreateHVTPayload {
  programId: string;
  sprintId: string;
  hypothesis: string;
  successCriteria: string;
  variantA: string;
  variantB?: string;
}
