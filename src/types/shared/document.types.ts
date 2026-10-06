/**
 * ============================================
 * DOCUMENT SHARING TYPES
 * API base: /api/v3/pdgms/documents
 * ============================================
 *
 * Documents attach to programs, sprints, or tickets.
 * Binary content is immutable after upload — only title/description can be updated.
 * Share tokens generate read-only public links (no auth required to view metadata).
 */

/** The entities a document can be attached to. */
export type DocumentEntityType = "program" | "sprint" | "ticket";

/**
 * A PDGMS document record as returned by the API.
 * storagePath: null means the record exists but the file has not been uploaded yet.
 * shareToken: null means no public share link has been generated.
 */
export interface PdgmsDocument {
  id: number;
  orgId: string;
  title: string;
  description: string | null;
  filename: string;
  mimeType: string | null;
  /** File size in bytes. */
  size: number;
  /** null = metadata-only record (file not yet stored). */
  storagePath: string | null;
  entityType: DocumentEntityType | null;
  entityId: string | null;
  /** Non-null after POST /:id/share. Used to construct the public URL. */
  shareToken: string | null;
  /** ISO datetime — null = link never expires. */
  shareExpiresAt: string | null;
  /** NodeBB uid of the uploader. */
  uploadedBy: string;
  /** True when the stored bytes require authenticated backend decryption. */
  encrypted?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated response wrapper for GET /api/v3/pdgms/documents.
 */
export interface PdgmsDocumentsResponse {
  items: PdgmsDocument[];
  total: number;
  page: number;
  perPage: number;
}

/**
 * Query filters for the document list endpoint.
 */
export interface DocumentFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  page?: number;
  perPage?: number;
  [key: string]: unknown;
}

/**
 * Used when calling DocumentService.upload().
 * The `file` field is sent as the binary form field in multipart/form-data.
 */
export interface DocumentUploadPayload {
  title: string;
  description?: string;
  entityType?: DocumentEntityType;
  entityId?: string;
  file: File;
}

/**
 * Only title and description are mutable after upload.
 * Binary content (the file itself) is immutable — per spec A149.
 */
export interface DocumentUpdatePayload {
  title?: string;
  description?: string;
}

/**
 * Payload for POST /api/v3/pdgms/documents/:id/share.
 * Omit expiresAt entirely to create a permanent (never-expiring) link.
 */
export interface DocumentSharePayload {
  expiresAt?: string;
}

/**
 * Response from POST /:id/share — the full updated Document with shareToken set.
 * Alias for PdgmsDocument (same shape, shareToken will be non-null).
 */
export type DocumentShareResponse = PdgmsDocument;
