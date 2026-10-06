"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MyProgramsHVTView, MyIdeas } from "@/components/shared/hvt";
import { PageHeader } from "@/components/shared/PageHeader";

type Tab = "experiments" | "ideas";

export function HVTContainer() {
  const [tab, setTab] = useState<Tab>("experiments");
  const router = useRouter();

  return (
    <div className="pb-6">
      <PageHeader
        title="Experiments"
        label="Aavahana"
        subtitle="When you see a problem in your work, suggest an experiment. Your TPM reviews ideas and runs the ones that could improve how the team works. Every experiment — even inconclusive ones — narrows the search space."
      />

      <div className="px-7">
        <div className="flex gap-1 mb-5 border-b border-b-base-300">
          {(["experiments", "ideas"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 border-none bg-transparent text-sm cursor-pointer ${
                tab === t
                  ? "font-bold text-primary border-b-2 border-b-primary"
                  : "font-medium dt-text-dim border-b-2 border-b-transparent"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "experiments" && (
          <MyProgramsHVTView onSelectExperiment={(exp) => router.push(`/aavahana/hvt/${exp.id}`)} />
        )}
        {tab === "ideas" && (
          <MyIdeas onNewIdea={() => router.push("/aavahana/hvt/ideas/new")} />
        )}
      </div>
    </div>
  );
}
