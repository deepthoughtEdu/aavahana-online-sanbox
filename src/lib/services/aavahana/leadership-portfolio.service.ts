import { api, isError } from "@/lib/api/client";
import type { LeadershipPortfolio } from "@/types";
import type { ApiResult } from "@/lib/api/client";
import type { Portfolio } from "@/lib/services/hcd/initiative.service";
import { normalizeLeadershipPortfolio } from "@/lib/adapters/aavahana-route.adapters";

export class LeadershipPortfolioService {
  /**
   * W3.1 — Improvement Objects past Prototyped (piloted/scaled) rendered as
   * presentable cases. `mine` scopes to the caller's own cases (owner view);
   * `programId` filters to one program. Legacy NULL-programId rows come back
   * grouped under "unassigned" by the backend, never dropped.
   */
  static async getCasePortfolio(
    opts: { mine?: boolean; programId?: number } = {}
  ): Promise<ApiResult<Portfolio>> {
    return api.get<Portfolio>("/v3/pdgms/hcd/initiatives/portfolio", {
      mine: opts.mine ? "true" : undefined,
      programId: opts.programId,
    });
  }

  /** Fetch current leadership portfolio */
  static async getPortfolio(
    period?: { from: string; to: string },
    uid?: string,
  ): Promise<ApiResult<LeadershipPortfolio | null>> {
    const result = await api.get<unknown>("/v3/pdgms/scoring/portfolios", { ...period, uid });
    if (isError(result)) return result;
    return normalizeLeadershipPortfolio(result);
  }

  /** Trigger generate_portfolio_narrative LLM call */
  static async generatePortfolio(period: {
    from: string;
    to: string;
  }, uid?: string): Promise<ApiResult<LeadershipPortfolio | null>> {
    const result = await api.post<unknown>("/v3/pdgms/scoring/portfolios/generate", {
      period,
      userId: uid,
      regenerate: true,
    });
    if (isError(result)) return result;
    return normalizeLeadershipPortfolio(result);
  }

  /**
   * Export a specific portfolio as PDF.
   *
   * Goes through api.download rather than window.open: a bare window.open sends
   * no X-Organization-Id, so requireOrganizationContext rejects it and the
   * browser navigates to a 400 JSON body instead of saving a file.
   */
  static async exportPortfolioPDF(portfolioId: string): Promise<string> {
    return api.download(
      `/v3/pdgms/scoring/portfolios/${portfolioId}?format=pdf`,
      `portfolio-${portfolioId}.pdf`
    );
  }
}
