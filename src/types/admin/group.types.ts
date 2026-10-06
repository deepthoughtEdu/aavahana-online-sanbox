// ─── Central Group Infrastructure ───────────────────────────────────────────

export interface OrgGroup {
  id: number;
  orgId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  miniGroups?: OrgMiniGroup[];
}

export interface OrgMiniGroup {
  id: number;
  groupId: number;
  orgId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number };
  members?: OrgMiniGroupMember[];
}

export interface OrgMiniGroupMember {
  id: number;
  miniGroupId: number;
  userId: string;
  eid?: number | null;
  addedBy: string;
  addedAt: string;
}

export interface GroupMemberSummary {
  userId: string;
  eid?: number | null;
  miniGroups: { id: number; name: string }[];
}

export interface GroupPrivilege {
  id: number;
  groupId: number;
  userId: string;
  grantedBy: string;
  grantedAt: string;
}

// ─── Payloads ───────────────────────────────────────────────────────────────

export interface CreateGroupPayload {
  name: string;
  description?: string;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
}

export interface CreateMiniGroupPayload {
  name: string;
  description?: string;
}

export interface UpdateMiniGroupPayload {
  name?: string;
  description?: string;
}

export interface AddMiniGroupMemberPayload {
  userId: string;
  eid?: number;
}

export interface GrantPrivilegePayload {
  userId: string;
}
