"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { SkillPath } from "@/components/hcd/SkillPath";

export default function SkillPathPage() {
  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader
        title="Operator's Run"
        label="Aavahana"
        subtitle="Choose a framework and practise decisions through a live scenario."
      />
      <div className="flex flex-col gap-4 px-4 mt-4 md:px-6">
        <SkillPath />
      </div>
    </div>
  );
}
