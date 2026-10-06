'use client';

import { PortfolioContainer } from '@/components/aavahana/leadership-portfolio/PortfolioContainer';
import type { LeadershipPortfolio as PortfolioType } from '@/types';

interface LeadershipPortfolioProps {
  portfolio: PortfolioType | null;
  isSubmitted: boolean;
}

export function LeadershipPortfolio({ portfolio, isSubmitted }: LeadershipPortfolioProps) {
  if (!portfolio && !isSubmitted) {
    return (
      <p className="text-sm text-base-content/50">
        Submit your monthly report to generate your Leadership Portfolio.
      </p>
    );
  }

  if (!portfolio && isSubmitted) {
    return (
		<p className="text-sm text-warning">
			This report has no linked portfolio. Open Leadership Portfolio and refresh this month’s evidence.
		</p>
    );
  }

  return <PortfolioContainer portfolio={portfolio} />;
}
