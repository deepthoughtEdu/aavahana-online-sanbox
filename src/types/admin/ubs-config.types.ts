export interface UbsRitual {
  weight: number;
  label: string;
}

export interface UbsMiniGroupConfig {
  id: number;
  orgId: string;
  miniGroupId: number;
  rituals: Record<string, UbsRitual>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertUbsConfigPayload {
  rituals: Record<string, UbsRitual>;
}

export interface HygieneOverlap {
  eid: number;
  userId: string;
  miniGroups: { id: number; name: string }[];
}

export interface HygieneScanResult {
  overlaps: HygieneOverlap[];
}
