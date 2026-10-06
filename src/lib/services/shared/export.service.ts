/**
 * ExportService — CSV and PDF file downloads
 *
 * Export is a modifier on existing list/report endpoints via ?format=csv or ?format=pdf.
 * This service handles the browser-side download logic — appending the format param,
 * fetching the binary response, and triggering a native browser download.
 *
 * No TanStack Query — export is an imperative action, not a reactive data query.
 *
 * Supported CSV endpoints:
 *   /v3/pdgms/programs/:id/tickets
 *   /v3/pdgms/programs
 *   /v3/pdgms/programs/:id/sprints
 *   /v3/pdgms/programs/:id/team
 *   /v3/pdgms/programs/:id/compliance
 *
 * Supported PDF endpoints:
 *   /v3/pdgms/programs/:id/reports/:reportId
 *   /v3/pdgms/programs/:id/compliance
 */
import { getApiContext } from "@/lib/api/client";

export class ExportService {
  /**
   * Appends ?format=csv to the given endpoint, fetches the CSV bytes,
   * and triggers a browser download with the given filename.
   *
   * @param endpoint - Path without /api prefix (e.g. "/v3/pdgms/programs/3/tickets")
   * @param filename - Filename for the downloaded file (e.g. "tickets-3.csv")
   *
   * @example
   * await ExportService.downloadCsv("/v3/pdgms/programs/3/tickets", "tickets-3.csv");
   */
  static async downloadCsv(endpoint: string, filename: string): Promise<void> {
    await ExportService._triggerDownload(endpoint, "csv", filename);
  }

  /**
   * Appends ?format=pdf to the given endpoint, fetches the PDF bytes,
   * and triggers a browser download with the given filename.
   *
   * Will throw if the server returns 501 (pdfkit not installed on backend).
   *
   * @param endpoint - Path without /api prefix (e.g. "/v3/pdgms/programs/3/reports/7")
   * @param filename - Filename for the downloaded file (e.g. "report-7.pdf")
   *
   * @example
   * await ExportService.downloadPdf("/v3/pdgms/programs/3/reports/7", "report-7.pdf");
   */
  static async downloadPdf(endpoint: string, filename: string): Promise<void> {
    await ExportService._triggerDownload(endpoint, "pdf", filename);
  }

  /**
   * Internal — builds the URL, fetches binary content, and triggers browser download.
   * Uses credentials:include so the session cookie is forwarded through the Next.js proxy.
   * The endpoint may already carry a query string (filtered exports) — the
   * format param is appended with the correct separator either way.
   */
  private static async _triggerDownload(
    endpoint: string,
    format: "csv" | "pdf",
    filename: string
  ): Promise<void> {
    const sep = endpoint.includes("?") ? "&" : "?";
    const url = `/api${endpoint}${sep}format=${format}`;

    // The org-scoped backend routes require X-Organization-Id (resolved only
    // from the header — no query/session fallback). The api client injects
    // these on every JSON call; this bare fetch must do the same or the
    // download 400s on requireOrganizationContext.
    const headers: Record<string, string> = {};
    const organizationId = getApiContext("organizationId");
    if (organizationId) headers["X-Organization-Id"] = organizationId;
    const userId = getApiContext("uid");
    if (userId) headers["X-User-Id"] = userId;
    const employeeId = getApiContext("eid");
    if (employeeId) headers["X-Employee-Id"] = employeeId;

    const response = await fetch(url, { credentials: "include", headers });

    if (!response.ok) {
      // Surface backend error codes (e.g. 501 export-pdf-unavailable) as thrown errors.
      let message = `Export failed: ${response.status} ${response.statusText}`;
      try {
        const body = await response.json();
        if (body?.status?.message) message = body.status.message;
      } catch {
        // Body was not JSON (e.g. already a binary stream on unexpected error) — use status text.
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    // Trigger native browser download then immediately free the object URL.
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }
}
