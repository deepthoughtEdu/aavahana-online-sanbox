/**
 * DocumentService — PDGMS Document Sharing
 * API base: /api/v3/pdgms/documents
 *
 * Documents attach to programs, sprints, or tickets and are scoped to the
 * current org via X-Organization-Id (set automatically by the API client).
 *
 * Binary content is immutable after upload — only title/description can change.
 * Share tokens produce public read-only links; no auth required to view metadata.
 */
import { api, ApiResult } from "@/lib/api/client";
import type {
  PdgmsDocument,
  PdgmsDocumentsResponse,
  DocumentFilters,
  DocumentUploadPayload,
  DocumentUpdatePayload,
  DocumentSharePayload,
} from "@/types";

const BASE = "/v3/pdgms/ai/documents";

export class DocumentService {
  /**
   * Upload a new document attached to an optional entity (program/sprint/ticket).
   * Sent as multipart/form-data. Returns the created Document record.
   *
   * Binary content is immutable after upload — per spec A149.
   */
  static async upload(
    payload: DocumentUploadPayload
  ): Promise<ApiResult<PdgmsDocument>> {
    // Build multipart form data — file upload requires FormData, not JSON.
    const form = new FormData();
    form.append("title", payload.title);
    if (payload.description) form.append("description", payload.description);
    if (payload.entityType) form.append("entityType", payload.entityType);
    if (payload.entityId) form.append("entityId", payload.entityId);
    form.append("file", payload.file, payload.file.name);

    return api.post<PdgmsDocument>(BASE, form);
  }

  /**
   * List documents with optional filters.
   * Paginated — defaults to page 1, 20 per page.
   * Filter by entityType + entityId to get all docs for a specific entity.
   */
  static async list(
    filters?: DocumentFilters
  ): Promise<ApiResult<PdgmsDocumentsResponse>> {
    return api.get<PdgmsDocumentsResponse>(BASE, filters);
  }

  /**
   * Get a single document by ID.
   * Returns null if not found (404 is surfaced as null by the hook, not a throw).
   */
  static async get(id: number): Promise<ApiResult<PdgmsDocument>> {
    return api.get<PdgmsDocument>(`${BASE}/${id}`);
  }

  /**
   * Download the raw file bytes for a document.
   * Constructs a blob URL and triggers a browser <a download> — never opens JSON.
   * Will reject with "document-file-not-available" if storagePath is null.
   */
  static async download(id: number, filename: string): Promise<void> {
    // Bypass the JSON-expecting api client — fetch the raw binary stream directly.
    const response = await fetch(`/api${BASE}/${id}/download`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Trigger native browser download then immediately revoke the object URL.
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  /**
   * Update a document's title or description.
   * Binary content (the file) is immutable — this only updates metadata.
   */
  static async update(
    id: number,
    payload: DocumentUpdatePayload
  ): Promise<ApiResult<PdgmsDocument>> {
    return api.put<PdgmsDocument>(`${BASE}/${id}`, payload);
  }

  /**
   * Delete a document and its stored file.
   * This action is permanent — documents are not soft-deleted.
   */
  static async delete(id: number): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`${BASE}/${id}`);
  }

  /**
   * Generate (or regenerate) a read-only share token for a document.
   * Omit expiresAt to create a permanent (never-expiring) link.
   *
   * The shareable URL the client constructs:
   *   GET /api/v3/pdgms/documents/shared/<shareToken>
   */
  static async share(
    id: number,
    payload: DocumentSharePayload
  ): Promise<ApiResult<PdgmsDocument>> {
    return api.post<PdgmsDocument>(`${BASE}/${id}/share`, payload);
  }

  /**
   * Fetch document metadata via a public share token.
   * No authentication required — public endpoint.
   * Returns metadata only — not file bytes.
   *
   * Rejects with "share-link-expired" if shareExpiresAt is in the past.
   */
  static async getPublic(token: string): Promise<ApiResult<PdgmsDocument>> {
    return api.get<PdgmsDocument>(`${BASE}/shared/${token}`);
  }
}
