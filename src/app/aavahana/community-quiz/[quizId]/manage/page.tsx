"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCommunityQuizDetail, useCommunityQuizActions, useCommunityQuizResponses } from "@/lib/hooks/aavahana/use-community-quiz";
import { QuizDetailHeader } from "@/components/aavahana/community-quiz/QuizDetailHeader";
import { QuizStatusStepper } from "@/components/aavahana/community-quiz/QuizStatusStepper";
import { ExportResponsesButton } from "@/components/aavahana/community-quiz/ExportResponsesButton";
import { InviteLinkPanel } from "@/components/aavahana/community-quiz/InviteLinkPanel";
import { SubjectiveFormBuilder } from "@/components/aavahana/community-quiz/SubjectiveFormBuilder";
import { McqFormBuilder } from "@/components/aavahana/community-quiz/McqFormBuilder";
import { useQuizSocket } from "@/lib/hooks/aavahana/use-quiz-socket";
import type { CommunityQuizStatus } from "@/types/aavahana/community-quiz.types";

const NEXT_STATUS: Partial<Record<CommunityQuizStatus, CommunityQuizStatus>> = {
  draft: "subjective_open",
  subjective_open: "subjective_closed",
  subjective_closed: "mcq_open",
  mcq_open: "mcq_closed",
  mcq_closed: "scored",
  scored: "archived",
};

const NEXT_LABEL: Partial<Record<CommunityQuizStatus, string>> = {
  draft: "Open Subjective Round",
  subjective_open: "Close Subjective Round",
  subjective_closed: "Open MCQ Round",
  mcq_open: "Close MCQ Round",
  mcq_closed: "Score Quiz",
  scored: "Archive",
};

export default function CommunityQuizManagePage() {
  const params = useParams<{ quizId: string }>();
  const quizId = Number(params.quizId);
  const { quiz, isLoading, error } = useCommunityQuizDetail(quizId);
  const { responses } = useCommunityQuizResponses(quizId);
  const actions = useCommunityQuizActions(quizId);
  useQuizSocket(quizId);

  const [videoUrl, setVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    if (quiz) {
      setVideoUrl(quiz.videoUrl ?? "");
      setTranscript(quiz.transcript ?? "");
    }
  }, [quiz]);

  if (isLoading) {
    return <div className="p-10 text-center dt-text-dim">Loading…</div>;
  }

  if (error || !quiz) {
    return <div className="p-10 text-center text-error">{error ?? "Quiz not found."}</div>;
  }

  const nextStatus = NEXT_STATUS[quiz.status];
  const nextLabel = NEXT_LABEL[quiz.status];

  const handleTransition = async () => {
    if (!nextStatus) return;
    if (nextStatus === "scored") {
      await actions.triggerScoring(quizId);
    } else {
      await actions.transitionStatus({ quizId, status: nextStatus });
    }
  };

  return (
    <div className="p-[24px_28px] space-y-6">
      <QuizDetailHeader quiz={quiz} />
      <QuizStatusStepper currentStatus={quiz.status} />

      {/* Status transition */}
      {nextStatus && (
        <div className="flex items-center gap-3">
          <button
            className="btn btn-sm btn-primary"
            onClick={handleTransition}
            disabled={actions.isTransitioning || actions.isScoring}
          >
            {actions.isTransitioning || actions.isScoring ? "Processing…" : nextLabel}
          </button>
        </div>
      )}

      {/* Invite link panel — visible in all non-archived states */}
      {quiz.status !== "archived" && (
        <InviteLinkPanel quizId={quizId} />
      )}

      {/* Draft: Set video + transcript */}
      {quiz.status === "draft" && (
        <div className="p-4 rounded-xl border border-base-300 space-y-3">
          <h3 className="font-medium text-sm">Video & Transcript</h3>
          <input
            type="url"
            className="input input-bordered input-sm w-full"
            placeholder="Video URL (YouTube, Loom, etc.)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <textarea
            className="textarea textarea-bordered w-full min-h-[100px] text-xs"
            placeholder="Paste video transcript here…"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
          <button
            className="btn btn-sm btn-outline"
            onClick={async () => {
              await actions.updateQuiz({ quizId, updates: { videoUrl: videoUrl || undefined, transcript: transcript || undefined } });
            }}
            disabled={actions.isUpdating}
          >
            {actions.isUpdating ? "Saving…" : "Save Video & Transcript"}
          </button>
        </div>
      )}

      {/* Draft: Form builder for subjective questions */}
      {quiz.status === "draft" && (
        <SubjectiveFormBuilder quizId={quizId} questions={quiz.questions ?? []} />
      )}

      {/* Subjective Closed: Export responses + MCQ builder */}
      {quiz.status === "subjective_closed" && (
        <>
          <div className="p-4 rounded-xl border border-base-300 space-y-3">
            <h3 className="font-medium text-sm">Subjective Responses</h3>
            <p className="text-xs dt-text-dim">
              {responses.length} response(s) collected. Export to CSV, identify wrong interpretations, then craft MCQs with bait options.
            </p>
            <ExportResponsesButton quizId={quizId} />
          </div>

          <McqFormBuilder quizId={quizId} mcqs={quiz.mcqs ?? []} />
        </>
      )}

      {/* Any status: Show current questions/mcqs count */}
      {quiz.status !== "draft" && quiz.status !== "subjective_closed" && (
        <div className="p-4 rounded-xl border border-base-300 text-sm dt-text-dim">
          {quiz._count?.questions ?? 0} subjective questions · {quiz._count?.mcqs ?? 0} MCQs · {quiz._count?.scores ?? 0} participants scored
        </div>
      )}
    </div>
  );
}
