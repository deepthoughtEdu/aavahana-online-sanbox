import { api, type ApiResult } from "@/lib/api/client";
import type {
  TalkingDocument, TalkingDocSummary,
  CreateTalkingDocPayload, UpdateTalkingDocPayload,
  UpdateCellPayload, InteractionLog,
  CoPilotQueryPayload, CoPilotQueryResponse,
} from "@/types/shared/talking-doc.types";

/** Backend paginatedResponse shape: { items, total, page, perPage } */
interface TalkingDocListResponse {
  items: TalkingDocSummary[];
  total: number;
  page: number;
  perPage: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class TalkingDocService {
  /** Fetch all talking documents (summary list). */
  static async getDocuments(): Promise<ApiResult<TalkingDocListResponse>> {
    return api.get<TalkingDocListResponse>("/v3/pdgms/ai/talking-docs");
  }

  /** Fetch a single talking document with full cells. */
  static async getDocument(id: string): Promise<ApiResult<TalkingDocument>> {
    return api.get<TalkingDocument>(`/v3/pdgms/ai/talking-docs/${id}`);
  }

  /** Create a new talking document. */
  static async createDocument(
    data: CreateTalkingDocPayload,
  ): Promise<ApiResult<TalkingDocument>> {
    return api.post<TalkingDocument>("/v3/pdgms/ai/talking-docs", data);
  }

  /** Update talking document metadata. */
  static async updateDocument(
    id:   string,
    data: UpdateTalkingDocPayload,
  ): Promise<ApiResult<TalkingDocument>> {
    return api.put<TalkingDocument>(`/v3/pdgms/ai/talking-docs/${id}`, data);
  }

  /** Update a single grid cell. */
  static async updateCell(
    docId:   string,
    cellKey: string,
    data:    UpdateCellPayload,
  ): Promise<ApiResult<TalkingDocument>> {
    return api.put<TalkingDocument>(
      `/v3/pdgms/ai/talking-docs/${docId}/cells/${cellKey}`,
      data,
    );
  }

  /** Archive (soft-delete) a document. */
  static async archiveDocument(id: string): Promise<ApiResult<void>> {
    return api.delete<void>(`/v3/pdgms/ai/talking-docs/${id}`);
  }

  /** Send a CoPilot query (BYOK proxy). Returns complete response — not streaming. */
  static async sendCoPilotQuery(
    docId:   string,
    payload: CoPilotQueryPayload,
  ): Promise<ApiResult<CoPilotQueryResponse>> {
    return api.post<CoPilotQueryResponse>(`/v3/pdgms/ai/talking-docs/${docId}/copilot`, payload);
  }

  /** Fetch interaction logs for a document. */
  static async getInteractionLogs(
    docId: string,
  ): Promise<ApiResult<InteractionLog[]>> {
    return api.get<InteractionLog[]>(`/v3/pdgms/ai/talking-docs/${docId}/interactions`);
  }

  /** Log a new interaction. */
  static async logInteraction(
    docId: string,
    data:  Omit<InteractionLog, "_id" | "documentId">,
  ): Promise<ApiResult<InteractionLog>> {
    return api.post<InteractionLog>(
      `/v3/pdgms/ai/talking-docs/${docId}/interactions`,
      data,
    );
  }
}
