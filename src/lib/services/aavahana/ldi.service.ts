import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { BackendPaginatedResponse } from "@/types/shared/api.types";
import type {
  LdiSession,
  LdiPitch,
  LdiReflectionBoard,
  LdiSessionAnalytics,
  LdiSessionAttendance,
  LdiTilePalette,
  CreateLdiSessionPayload,
  UpdateLdiSessionPayload,
  CreateLdiPitchPayload,
  SaveTilesPayload,
  CreatePalettePayload,
  LdiSessionListParams,
  LdiSessionStatus,
  LdiVisibility,
  LdiInviteResult,
  LdiInvitedOrgsResponse,
} from "@/types/aavahana/ldi.types";

const SESSIONS = "/v3/pdgms/loops/ldi/sessions";
const BOARDS = "/v3/pdgms/loops/ldi/boards";

export class LdiService {
  // ── Sessions ──

  static async createSession(payload: CreateLdiSessionPayload): Promise<ApiResult<LdiSession>> {
    return api.post<LdiSession>(SESSIONS, payload);
  }

  static async listSessions(params?: LdiSessionListParams): Promise<ApiResult<BackendPaginatedResponse<LdiSession>>> {
    return api.get<BackendPaginatedResponse<LdiSession>>(SESSIONS, params);
  }

  static async getSession(id: string): Promise<ApiResult<LdiSession>> {
    return api.get<LdiSession>(`${SESSIONS}/${id}`);
  }

  static async updateSession(id: string, data: UpdateLdiSessionPayload): Promise<ApiResult<LdiSession>> {
    return api.put<LdiSession>(`${SESSIONS}/${id}`, data);
  }

  static async transitionSession(id: string, status: LdiSessionStatus): Promise<ApiResult<LdiSession>> {
    return api.patch<LdiSession>(`${SESSIONS}/${id}/status`, { status });
  }

  // ── Pitches ──

  static async createPitch(sessionId: string, payload: CreateLdiPitchPayload): Promise<ApiResult<LdiPitch>> {
    return api.post<LdiPitch>(`${SESSIONS}/${sessionId}/pitches`, payload);
  }

  static async listPitches(sessionId: string): Promise<ApiResult<LdiPitch[]>> {
    return api.get<LdiPitch[]>(`${SESSIONS}/${sessionId}/pitches`);
  }

  static async updatePitch(sessionId: string, pitchId: string, data: Partial<CreateLdiPitchPayload>): Promise<ApiResult<LdiPitch>> {
    return api.put<LdiPitch>(`${SESSIONS}/${sessionId}/pitches/${pitchId}`, data);
  }

  static async annotatePitch(sessionId: string, pitchId: string, annotation: string): Promise<ApiResult<LdiPitch>> {
    return api.put<LdiPitch>(`${SESSIONS}/${sessionId}/pitches/${pitchId}/annotate`, { annotation });
  }

  // Records the caller on the session roster (idempotent). Called when a
  // participant opens a shared invite link.
  static async attend(sessionId: string): Promise<ApiResult<LdiSessionAttendance>> {
    return api.patch<LdiSessionAttendance>(`${SESSIONS}/${sessionId}/attend`, {});
  }

  static async listAttendance(sessionId: string): Promise<ApiResult<LdiSessionAttendance[]>> {
    return api.get<LdiSessionAttendance[]>(`${SESSIONS}/${sessionId}/attendance`);
  }

  // ── Access (facilitator-only) ──

  static async setVisibility(sessionId: string, visibility: LdiVisibility): Promise<ApiResult<{ sessionId: string; visibility: LdiVisibility }>> {
    return api.put<{ sessionId: string; visibility: LdiVisibility }>(`${SESSIONS}/${sessionId}/visibility`, { visibility });
  }

  static async inviteOrgs(sessionId: string, orgIds: string[]): Promise<ApiResult<LdiInviteResult>> {
    return api.post<LdiInviteResult>(`${SESSIONS}/${sessionId}/invites`, { orgIds });
  }

  static async listInvitedOrgs(sessionId: string): Promise<ApiResult<LdiInvitedOrgsResponse>> {
    return api.get<LdiInvitedOrgsResponse>(`${SESSIONS}/${sessionId}/invites`);
  }

  static async revokeOrgInvite(sessionId: string, orgId: string): Promise<ApiResult<{ revoked: boolean }>> {
    return api.delete<{ revoked: boolean }>(`${SESSIONS}/${sessionId}/invites/${orgId}`);
  }

  // ── Boards ──

  static async createBoard(sessionId: string): Promise<ApiResult<LdiReflectionBoard>> {
    return api.post<LdiReflectionBoard>(BOARDS, { sessionId });
  }

  static async listMyBoards(params?: { page?: number; perPage?: number }): Promise<ApiResult<BackendPaginatedResponse<LdiReflectionBoard>>> {
    return api.get<BackendPaginatedResponse<LdiReflectionBoard>>(`${BOARDS}/mine`, params);
  }

  static async getBoard(boardId: string): Promise<ApiResult<LdiReflectionBoard>> {
    return api.get<LdiReflectionBoard>(`${BOARDS}/${boardId}`);
  }

  static async saveTiles(boardId: string, payload: SaveTilesPayload): Promise<ApiResult<LdiReflectionBoard>> {
    return api.put<LdiReflectionBoard>(`${BOARDS}/${boardId}/tiles`, payload);
  }

  static async completeBoard(boardId: string): Promise<ApiResult<LdiReflectionBoard>> {
    return api.patch<LdiReflectionBoard>(`${BOARDS}/${boardId}/complete`);
  }

  // ── Analytics ──

  static async getSessionAnalytics(sessionId: string): Promise<ApiResult<LdiSessionAnalytics>> {
    return api.get<LdiSessionAnalytics>(`${BOARDS}/sessions/${sessionId}/analytics`);
  }

  // ── Palettes ──

  static async listPalettes(sessionId?: string): Promise<ApiResult<LdiTilePalette[]>> {
    return api.get<LdiTilePalette[]>(`${BOARDS}/palettes`, sessionId ? { sessionId } : undefined);
  }

  static async createPalette(payload: CreatePalettePayload): Promise<ApiResult<LdiTilePalette>> {
    return api.post<LdiTilePalette>(`${BOARDS}/palettes`, payload);
  }

  static async updatePalette(paletteId: string, data: Partial<CreatePalettePayload>): Promise<ApiResult<LdiTilePalette>> {
    return api.put<LdiTilePalette>(`${BOARDS}/palettes/${paletteId}`, data);
  }

  static async deactivatePalette(paletteId: string): Promise<ApiResult<LdiTilePalette>> {
    return api.delete<LdiTilePalette>(`${BOARDS}/palettes/${paletteId}`);
  }
}
