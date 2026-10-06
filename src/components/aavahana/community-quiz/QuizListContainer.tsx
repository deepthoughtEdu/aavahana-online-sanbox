"use client";

import { useState } from "react";
import Link from "next/link";
import { useCommunityQuizList, useCommunityQuizActions } from "@/lib/hooks/aavahana/use-community-quiz";
import { PageHeader } from "@/components/shared/PageHeader";
import type { CommunityQuizStatus } from "@/types/aavahana/community-quiz.types";

const STATUS_BADGES: Record<CommunityQuizStatus, string> = {
  draft: "badge-ghost",
  subjective_open: "badge-info",
  subjective_closed: "badge-warning",
  mcq_open: "badge-accent",
  mcq_closed: "badge-warning",
  scored: "badge-success",
  archived: "badge-neutral",
};

export function QuizListContainer() {
  const [statusFilter, setStatusFilter] = useState<CommunityQuizStatus | undefined>(undefined);
  const { quizzes, total: _total, isLoading, error } = useCommunityQuizList({ status: statusFilter });
  const { createQuiz, isCreating } = useCommunityQuizActions();

  const handleCreate = async () => {
    const title = prompt("Quiz title:");
    if (!title) return;
    await createQuiz({ title });
  };

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
        <div className="alert alert-error max-w-md"><span>{error}</span></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader title="Community Quiz" subtitle="Conceptual clarity through interpretation" />

      <div className="px-6 py-4 flex items-center justify-between">
        <select
          className="select select-sm select-bordered"
          value={statusFilter ?? ""}
          onChange={(e) => setStatusFilter((e.target.value || undefined) as CommunityQuizStatus | undefined)}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="subjective_open">Subjective Open</option>
          <option value="mcq_open">MCQ Open</option>
          <option value="scored">Scored</option>
        </select>

        <button className="btn btn-sm btn-primary" onClick={handleCreate} disabled={isCreating}>
          {isCreating ? "Creating…" : "+ New Quiz"}
        </button>
      </div>

      <div className="px-6 space-y-3">
        {quizzes.length === 0 && (
          <p className="text-center text-sm dt-text-dim py-10">No quizzes yet.</p>
        )}
        {quizzes.map((quiz) => (
          <Link
            key={quiz.id}
            href={`/aavahana/community-quiz/${quiz.id}`}
            className="block p-4 rounded-xl bg-base-100 border border-base-300 hover:border-primary transition-colors"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{quiz.title}</h3>
              <span className={`badge badge-sm ${STATUS_BADGES[quiz.status]}`}>
                {quiz.status.replace(/_/g, " ")}
              </span>
            </div>
            {quiz._count && (
              <div className="mt-1 text-xs dt-text-dim">
                {quiz._count.questions} questions · {quiz._count.mcqs} MCQs · {quiz._count.scores} scored
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
