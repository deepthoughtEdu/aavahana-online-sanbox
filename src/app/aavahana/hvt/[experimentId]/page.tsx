"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useHVTExperiment } from "@/lib/hooks/shared/use-hvt";
import { ExperimentDetail } from "@/components/hvt/ExperimentDetail";

export default function AavahanaExperimentDetailPage() {
  const params = useParams<{ experimentId: string }>();
  const { data: experiment, isLoading } = useHVTExperiment(params.experimentId);

  if (isLoading) {
    return <div className="p-10 text-center dt-text-dim">Loading experiment…</div>;
  }

  if (!experiment) {
    return <div className="p-10 text-center text-error">Experiment not found.</div>;
  }

  return (
    <div className="p-[24px_28px]">
      <ExperimentDetail experiment={experiment} readOnly viewerLanguage="plain" />

      {/* CTA to share an idea */}
      <div className="mt-6 p-4 rounded-xl bg-base-200 border border-base-300 text-center">
        <div className="text-xs dt-text-dim mb-2">
          Have an idea for an experiment?
        </div>
        <Link href="/aavahana/hvt/ideas/new" className="btn btn-sm btn-primary">
          Share an Idea
        </Link>
      </div>
    </div>
  );
}
