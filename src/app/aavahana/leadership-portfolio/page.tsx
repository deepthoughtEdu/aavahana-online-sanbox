"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { useLeadershipPortfolio } from "@/lib/hooks/aavahana/use-leadership-portfolio";
import { PortfolioContainer } from "@/components/aavahana/leadership-portfolio/PortfolioContainer";
import { Button } from "@/components/shared/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { todayISO } from "@/utils/shared/date.utils";

function periodForMonth(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

export default function LeadershipPortfolioPage() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || undefined;
  // The viewer's month, not UTC's. Before 05:30 IST on the 1st, the UTC date
  // is still last month.
  const [month, setMonth] = useState(() => todayISO().slice(0, 7));
  const period = useMemo(() => periodForMonth(month), [month]);
  const { portfolio, isLoading, isGenerating, error, generate, exportPDF } =
    useLeadershipPortfolio(period, uid);
  const { user } = useAuth();
  // Only name the subject when it IS the caller. A manager opening someone
  // else's portfolio must not see their own name on it.
  const subjectName = uid ? undefined : (user?.fullname || user?.username);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Leadership Portfolio"
        subtitle={uid ? `Monthly evidence portfolio for UID ${uid}` : "Your monthly evidence across the six career axes"}
      >
        <input
          aria-label="Portfolio month"
          className="input input-bordered input-sm"
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />
        <Button size="sm" variant="outline" disabled={!portfolio} onClick={exportPDF}>
          Export PDF
        </Button>
        <Button size="sm" loading={isGenerating} onClick={generate}>
          {portfolio ? "Refresh evidence" : "Generate portfolio"}
        </Button>
      </PageHeader>

      {isLoading ? (
        <PortfolioSkeleton />
      ) : error ? (
        <div className="alert alert-error"><span>{error}</span></div>
      ) : (
        <PortfolioContainer portfolio={portfolio} subjectName={subjectName} />
      )}
    </div>
  );
}

/** Mirrors the document rhythm — hero, then stacked slides — not the old card grid. */
function PortfolioSkeleton() {
  return (
    <div className="max-w-3xl">
      <div className="space-y-3 border-b border-base-300 py-10">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-5 w-72 rounded" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-4 border-b border-base-300 py-10">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-4/5 rounded" />
          <div className="skeleton h-12 w-28 rounded" />
        </div>
      ))}
    </div>
  );
}
