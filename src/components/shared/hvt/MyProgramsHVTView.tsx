"use client";

import React, { useState } from "react";
import { useMyProgramsHVT, useHVTExperiments } from "@/lib/hooks/shared/use-hvt";
import { ExperimentCard, StatCard } from "@/components/hvt";
import type { ExperimentStatus, HVTExperiment } from "@/types/shared/hvt.types";

interface Props {
  onSelectExperiment?: (experiment: HVTExperiment) => void;
}

export function MyProgramsHVTView({ onSelectExperiment }: Props) {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useMyProgramsHVT();
  const [selectedProgram, setSelectedProgram] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | undefined>();

  const { data: experiments, isLoading: experimentsLoading } = useHVTExperiments(
    selectedProgram ? { programId: selectedProgram, status: statusFilter } : undefined,
    !!selectedProgram
  );

  if (overviewLoading) {
    return <div className="p-10 text-center dt-text-dim">Loading…</div>;
  }
  if (overviewError || !overview) {
    return <div className="p-10 text-center text-error">Failed to load HVT overview.</div>;
  }

  return (
    <div>
      {/* Overview cards */}
      {overview && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5 mb-5">
          <StatCard label="Total Experiments" value={overview.totalExperiments} />
          <StatCard label="Running" value={overview.totalRunning} color="var(--color-info)" />
          <StatCard label="Concluded" value={overview.totalConcluded} color="var(--color-success)" />
        </div>
      )}

      {/* Program cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2.5 mb-5">
        {overview?.programs.map((p) => (
          <div
            key={p.programId}
            onClick={() => setSelectedProgram(selectedProgram === p.programId ? undefined : p.programId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") setSelectedProgram(selectedProgram === p.programId ? undefined : p.programId); }}
            className={`px-4 py-3.5 rounded-xl bg-base-100 cursor-pointer ${
              selectedProgram === p.programId
                ? "border-2 border-primary"
                : "border-2 border-base-300"
            }`}
          >
            <div className="text-sm font-bold text-base-content">{p.programName}</div>
            <div className="flex gap-3 mt-2 text-xs">
              <div>
                <span className="font-extrabold text-info">{p.byStatus.running}</span>
                <span className="dt-text-dim ml-1">running</span>
              </div>
              <div>
                <span className="font-extrabold text-success">{p.byStatus.concluded}</span>
                <span className="dt-text-dim ml-1">done</span>
              </div>
              <div>
                <span className="font-extrabold text-primary">{p.winRate}%</span>
                <span className="dt-text-dim ml-1">win</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Experiment list (when program selected) */}
      {selectedProgram && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[15px] font-bold text-base-content m-0">
              Experiments
            </h3>
            <select
              value={statusFilter ?? ""}
              onChange={(e) => setStatusFilter((e.target.value || undefined) as ExperimentStatus | undefined)}
              className="select select-bordered select-xs"
            >
              <option value="">All</option>
              <option value="running">Running</option>
              <option value="concluded">Concluded</option>
            </select>
          </div>

          {experimentsLoading && <div className="p-5 dt-text-dim">Loading…</div>}

          <div className="flex flex-col gap-2.5">
            {experiments?.map((exp) => (
              <ExperimentCard key={exp.id} experiment={exp} onClick={onSelectExperiment} />
            ))}
          </div>

          {experiments?.length === 0 && !experimentsLoading && (
            <div className="p-8 text-center dt-text-dim">
              No experiments running in this program yet. Ideas from team members become experiments when your TPM picks them up.
            </div>
          )}
        </div>
      )}

      {!selectedProgram && overview && overview.programs.length > 0 && (
        <div className="p-8 text-center dt-text-dim text-sm">
          Select a program above to see its experiments.
        </div>
      )}
    </div>
  );
}
