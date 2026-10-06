"use client";

import React from "react";
import { useMyIdeas } from "@/lib/hooks/shared/use-hvt";
import { IdeaCard } from "@/components/hvt/IdeaCard";

interface Props {
  onNewIdea?: () => void;
}

export function MyIdeas({ onNewIdea }: Props) {
  const { data: ideas, isLoading, error } = useMyIdeas();

  if (isLoading) {
    return <div className="p-10 text-center dt-text-dim">Loading your ideas…</div>;
  }
  if (error || !ideas) {
    return <div className="p-10 text-center text-error">Failed to load ideas.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-base-content m-0">
          My Experiment Ideas
        </h3>
        {onNewIdea && (
          <button
            onClick={onNewIdea}
            className="btn btn-sm btn-primary"
          >
            + Share an Idea
          </button>
        )}
      </div>

      {ideas?.length === 0 && (
        <div className="p-10 text-center dt-text-dim">
          <div className="text-sm mb-2">
            No ideas yet. When you notice friction in your work — a slow process, a repeated mistake, a handoff that drops things — that&apos;s an experiment waiting to happen.
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {ideas?.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} showReviewNote />
        ))}
      </div>
    </div>
  );
}
