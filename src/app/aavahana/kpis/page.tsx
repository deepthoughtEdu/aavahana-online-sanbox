"use client";

import { useAuth } from "@/lib/hooks/shared/use-auth";
import { useKPIs } from "@/lib/hooks/aavahana/use-kpis";
import { PageHeader } from "@/components/shared/PageHeader";
import { KPIOverview } from "./_components/KPIOverview";
import { KPICard } from "./_components/KPICard";

export default function KPIsPage() {
  const { selectedProgram } = useAuth();
  const programId = selectedProgram?.id ?? "";

  const {
    monthLabel,
    goToPrevMonth,
    goToNextMonth,
    kpis,
    statusBreakdown,
    isLoading,
    error,
  } = useKPIs(programId);

  if (!selectedProgram) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm opacity-50">
          No program context — you must be a member of a program to view KPIs.
        </p>
      </div>
    );
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const memberCount = kpis[0]?.memberCount ?? 0;

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader
        title="KPIs"
        label="Aavahana"
        subtitle={`Key performance indicators for ${selectedProgram.name}`}
      />

      <div className="space-y-5">
        {/* Zone 1: Overview */}
        <KPIOverview
          programName={selectedProgram.name}
          monthLabel={monthLabel}
          kpiCount={kpis.length}
          statusBreakdown={statusBreakdown}
          memberCount={memberCount}
          onPrev={goToPrevMonth}
          onNext={goToNextMonth}
        />

        {/* Zone 2: KPI Cards */}
        {kpis.length === 0 ? (
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body text-center py-12">
              <p className="text-sm opacity-50">
                No KPIs defined for this program yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kpis.map((kpi) => (
              <KPICard key={kpi.kpiId} kpi={kpi} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
