"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LeadershipPortfolioService } from "@/lib/services/aavahana/leadership-portfolio.service";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { toast } from "@/utils";
import type { LeadershipPortfolio } from "@/types";
import type { Portfolio } from "@/lib/services/hcd/initiative.service";

interface UseLeadershipPortfolioReturn {
  portfolio: LeadershipPortfolio | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generate: () => Promise<void>;
  exportPDF: () => void;
  refresh: () => void;
}

interface UseCasePortfolioReturn {
  portfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * W3.1 — Leadership Portfolio as Improvement-Object cases past Prototyped.
 * `mine` gives the owner view; `programId` filters to one program.
 */
export function useLeadershipCasePortfolio(
  opts: { mine?: boolean; programId?: number } = {}
): UseCasePortfolioReturn {
  const { data: portfolio = null, isLoading, error, refetch } = useApi({
    queryKey: ["hcd", "portfolio", opts.mine ? "mine" : "all", opts.programId ?? null],
    queryFn: () => LeadershipPortfolioService.getCasePortfolio(opts),
  });

  return {
    portfolio,
    isLoading,
    error: error?.message ?? null,
    refresh: refetch,
  };
}

export function useLeadershipPortfolio(
  period?: { from: string; to: string },
  uid?: string,
): UseLeadershipPortfolioReturn {
  const queryClient = useQueryClient();

  const { data: portfolio = null, isLoading, error, refetch } = useApi({
    queryKey: ["leadership-portfolio", uid ?? "self", period?.from, period?.to],
    queryFn: () => LeadershipPortfolioService.getPortfolio(period, uid),
  });

  const generateMutation = useApiMutation({
    mutationFn: (p: { from: string; to: string }) => LeadershipPortfolioService.generatePortfolio(p, uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leadership-portfolio"] });
      toast.success("Portfolio generated!");
    },
    onError: () => toast.error("Failed to generate portfolio."),
  });

  async function exportPDF() {
    // The backend route and the service method both exist; only this hook was
    // still stubbed. Nothing to export before a portfolio has been generated.
    if (!portfolio?.portfolioId) {
      toast("Generate the portfolio first, then export it");
      return;
    }
    try {
      await LeadershipPortfolioService.exportPortfolioPDF(portfolio.portfolioId);
    } catch {
      toast("Could not export the portfolio PDF");
    }
  }

  return {
    portfolio,
    isLoading,
    isGenerating: generateMutation.isPending,
    error: error?.message ?? null,
    generate: async () => {
      if (!period) return;
      try { await generateMutation.mutateAsync(period); } catch { /* onError handles display */ }
    },
    exportPDF,
    refresh: refetch,
  };
}
