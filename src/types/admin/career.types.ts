export interface CareerMilestone {
  level: string;
  targetDate: string;
}

export interface CareerPlan {
  id: number;
  orgId: string;
  eid: number;
  ladderId: string | null;
  milestones: CareerMilestone[] | null;
  setBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SetCareerPlanPayload {
  ladderId?: string;
  milestones?: CareerMilestone[];
}

export interface CareerSnapshot {
  userId: string;
  currentLevel: string;
  ladderId: string;
  lastUpdated: string;
}

export interface CareerRunrate {
  userId: string;
  ladderId: string;
  currentLevel: string;
  projectedLevel: string;
  onTrack: boolean;
  runrateScore: number;
}
