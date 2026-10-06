export interface OrgTreeNode {
  eid: number;
  supervisorEid: number | null;
  displayName: string | null;
  title: string | null;
  isSupervisor: boolean;
  isArchived: boolean;
}

export interface OrgTreeResponse {
  nodes: OrgTreeNode[];
}

export interface SupervisorChainResponse {
  chain: OrgTreeNode[];
}

export interface UpsertNodePayload {
  eid: number;
  supervisorEid: number | null;
  displayName?: string;
  title?: string;
  isSupervisor?: boolean;
}

export interface MoveNodePayload {
  supervisorEid: number | null;
}

export interface BulkUpsertPayload {
  nodes: UpsertNodePayload[];
}
