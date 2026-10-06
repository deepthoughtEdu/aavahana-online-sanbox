"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCommunityQuizDetail, useCommunityQuizActions } from "@/lib/hooks/aavahana/use-community-quiz";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { useState } from "react";

export default function CommunityQuizJoinPage() {
  const params = useParams<{ quizId: string }>();
  const searchParams = useSearchParams();
  const quizId = Number(params.quizId);
  const token = searchParams.get("token") ?? "";
  const { quiz, isLoading, error } = useCommunityQuizDetail(quizId);
  const { eid } = useAuth();
  const actions = useCommunityQuizActions(quizId);
  const [joined, setJoined] = useState(false);

  if (isLoading) {
    return <div className="p-10 text-center dt-text-dim">Loading…</div>;
  }

  if (error || !quiz) {
    return <div className="p-10 text-center text-error">{error ?? "Quiz not found."}</div>;
  }

  if (!token) {
    return <div className="p-10 text-center text-error">Missing invite token.</div>;
  }

  if (!eid) {
    return <div className="p-10 text-center text-error">You must be logged in to join.</div>;
  }

  if (quiz.status === "archived") {
    return <div className="p-10 text-center dt-text-dim">This quiz has been archived.</div>;
  }

  const handleJoin = async () => {
    await actions.joinQuiz({ quizId, eid, token });
    setJoined(true);
  };

  if (joined) {
    return (
      <div className="p-10 text-center space-y-4">
        <h1 className="text-xl font-semibold">Joined!</h1>
        <p className="dt-text-dim">You&apos;ve joined <strong>{quiz.title}</strong>.</p>
        <p className="text-sm dt-text-dim">
          {quiz.status === "subjective_open"
            ? "The subjective round is open — head over to respond."
            : quiz.status === "mcq_open"
            ? "The MCQ round is open — go answer."
            : "You'll be notified when it's time to participate."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="p-8 rounded-2xl border border-base-300 max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-semibold">{quiz.title}</h1>
        {quiz.description && <p className="text-sm dt-text-dim">{quiz.description}</p>}
        <p className="text-sm">You&apos;ve been invited to participate in this community quiz.</p>
        <button
          className="btn btn-primary"
          onClick={handleJoin}
          disabled={actions.isJoining}
        >
          {actions.isJoining ? "Joining…" : "Join Quiz"}
        </button>
      </div>
    </div>
  );
}
