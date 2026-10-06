export type LdiSessionStatus = "draft" | "open" | "live" | "reflecting" | "completed";
export type LdiReflectionBoardStatus = "in_progress" | "completed";
export type LdiTileZone = "sensation" | "mental_model" | "connection" | "intent";
// Provenance of a placed tile (matches backend Prisma enum LdiTileType).
// default_tile = org-wide palette, session_specific = facilitator/session or
// participant-derived (e.g. connection tiles), custom = participant freetext.
export type LdiTileType = "default_tile" | "session_specific" | "custom";
// Controlled cross-org access (mirrors Session Activity's visibility).
export type LdiVisibility = "org_only" | "open";

export interface LdiSession {
  id: string;
  orgId: string;
  title: string;
  bigQuestion: string;
  frameworkLabelIds: number[];
  facilitatorEid: number;
  scheduledAt: string | null;
  status: LdiSessionStatus;
  visibility?: LdiVisibility;
  maxParticipants: number;
  seriesId: string | null;
  createdAt: string;
  updatedAt: string;
  // Per-viewer flags returned by GET /sessions/:id (computed from caller eid).
  isFacilitator?: boolean;
  hasJoined?: boolean;
  hasPitched?: boolean;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;
}

export interface LdiSessionAttendance {
  id: string;
  sessionId: string;
  participantEid: number;
  participantName?: string | null;
  joinedAt: string | null;
  // Join-time details snapshot (null on rows predating access control)
  homeOrgId?: string | null;
  uid?: string | null;
  displayName?: string | null;
  email?: string | null;
  joinedVia?: string | null;
}

export interface LdiInviteResult {
  sessionId: string;
  results: { orgId: string; status: string }[];
}

export interface LdiInvitedOrg {
  orgId: string;
  orgName: string | null;
  invitedBy: string;
  invitedAt: string;
  participantCount: number;
}

export interface LdiInvitedOrgsResponse {
  sessionId: string;
  visibility: LdiVisibility;
  invitedOrgs: LdiInvitedOrg[];
}

export interface LdiPitch {
  id: string;
  sessionId: string;
  participantEid: number;
  participantName?: string | null;
  summary: string;
  projectTag: string | null;
  programIds: number[];
  facilitatorAnnotation: string | null;
  createdAt: string;
}

export interface LdiReflectionTile {
  id: string;
  boardId: string;
  zone: LdiTileZone;
  tileType: LdiTileType;
  label: string;
  position: number;
  linkedLabelId: number | null;
  linkedEid: number | null;
  linkedPitchId: string | null;
  createdAt: string;
}

export interface LdiReflectionBoard {
  id: string;
  sessionId: string;
  participantEid: number;
  status: LdiReflectionBoardStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tiles?: LdiReflectionTile[];
  sessionTitle?: string;
  bigQuestion?: string;
}

export interface LdiTilePalette {
  id: string;
  orgId: string;
  sessionId: string | null;
  zone: LdiTileZone;
  label: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface LdiSessionAnalytics {
  totalBoards: number;
  completedBoards: number;
  completionRate: number;
  sensationHeatmap: Record<string, number>;
  mentalModelAdoption: Record<string, number>;
  connectionDensity: Record<string, number>;
  intentDistribution: Record<string, number>;
}

export interface CreateLdiSessionPayload {
  title: string;
  bigQuestion: string;
  frameworkLabelIds?: number[];
  scheduledAt?: string;
  maxParticipants?: number;
  seriesId?: string;
}

export interface UpdateLdiSessionPayload {
  title?: string;
  bigQuestion?: string;
  frameworkLabelIds?: number[];
  scheduledAt?: string;
  maxParticipants?: number;
}

export interface CreateLdiPitchPayload {
  sessionId: string;
  summary: string;
  projectTag?: string;
  programIds?: number[];
}

export interface TileInput {
  zone: LdiTileZone;
  tileType: LdiTileType;
  label: string;
  position: number;
  linkedLabelId?: number;
  linkedEid?: number;
  linkedPitchId?: string;
}

export interface SaveTilesPayload {
  tiles: TileInput[];
}

export interface CreatePalettePayload {
  zone: LdiTileZone;
  label: string;
  description?: string;
  sessionId?: string;
}

export interface LdiSessionListParams {
  status?: LdiSessionStatus;
  facilitatorEid?: number;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}
