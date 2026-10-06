"use client";

import React from "react";
import { useMyProgramsHVT, useSubmitIdea } from "@/lib/hooks/shared/use-hvt";
import { IdeaForm } from "@/components/hvt/IdeaForm";
import { EmptyState } from "@/components/shared/EmptyState";
import type { SubmitIdeaPayload } from "@/types/shared/hvt.types";

interface Props {
  onSuccess?: () => void;
}

export function SubmitIdea({ onSuccess }: Props) {
  const { data: overview, isLoading } = useMyProgramsHVT();
  const submitIdea = useSubmitIdea();

  // Defensive: the overview can come back without a programs array if the user
  // isn't a member of any program, in which case `overview.programs.map(...)`
  // crashed the whole page. Optional-chain both levels and fall back to [].
  const programs = overview?.programs?.map((p) => ({
    id: p.programId,
    name: p.programName,
  })) ?? [];

  // An experiment idea is filed INTO a program: `programId` is required by the
  // form schema, and the backend rejects a non-member outright
  // (assertIsProgramMember). This route is reachable by every member, so
  // someone in no program used to get a form whose only program option was
  // "Select a program…" and a submit button that could not do anything but
  // error. Say so instead.
  if (!isLoading && programs.length === 0) {
    return (
      <EmptyState
        variant="info"
        title="You're not in a program yet"
        subtitle="Experiment ideas are filed inside a program. Once you're added to one, you can suggest experiments here."
      />
    );
  }

  const handleSubmit = async (payload: SubmitIdeaPayload) => {
    await submitIdea.mutateAsync(payload);
    onSuccess?.();
  };

  return (
    <IdeaForm
      programs={programs}
      onSubmit={handleSubmit}
      isSubmitting={submitIdea.isPending}
    />
  );
}
