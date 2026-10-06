'use client';

import { useCareerRunrate } from '@/lib/hooks/aavahana/use-career-runrate';
import { CareerRunrateContainer } from '@/components/aavahana/career-runrate/CareerRunrateContainer';
import { CareerRunrateService } from '@/lib/services/aavahana/career-runrate.service';
import { PageHeader } from '@/components/shared/PageHeader';
import { useApi } from '@/lib/hooks/shared/use-api';
import { Button } from '@/components/shared/Button';
import { todayISO } from "@/utils/shared/date.utils";

export default function CareerRunratePage() {
  const { data, snapshots, isLoading, error, refresh } = useCareerRunrate();
  const { data: ladderDetails } = useApi({
    queryKey: ["ladder-details"],
    queryFn: () => CareerRunrateService.getLadderDetails(),
  });

  function exportCsv() {
    if (!data) return;
    const rows = [
      ['date', 'level', 'composite_score', 'deliverables', 'ip', 'kpis', 'frameworks', 'processes', 'rituals'],
      ...snapshots.map((snapshot) => [
        snapshot.date,
        snapshot.level ?? '',
        snapshot.compositeScore,
        snapshot.axisScores.deliverables,
        snapshot.axisScores.ip,
        snapshot.axisScores.kpis,
        snapshot.axisScores.frameworks,
        snapshot.axisScores.processes,
        snapshot.axisScores.rituals,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `career-runrate-${todayISO()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={refresh}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Career Runrate"
        subtitle="Track your planned, actual, and projected career trajectory"
      >
        <Button size="sm" variant="outline" disabled={!data} onClick={exportCsv}>
          Export CSV
        </Button>
      </PageHeader>

      <div>
        <CareerRunrateContainer
          data={data}
          snapshots={snapshots}
          ladderDetails={ladderDetails}
        />
      </div>
    </div>
  );
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
