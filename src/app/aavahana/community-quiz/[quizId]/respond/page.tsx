"use client";

import { useParams } from "next/navigation";
import { useCommunityQuizDetail } from "@/lib/hooks/aavahana/use-community-quiz";
import { SubjectiveResponseForm } from "@/components/aavahana/community-quiz/SubjectiveResponseForm";
import { useAuth } from "@/lib/hooks/shared/use-auth";

export default function CommunityQuizRespondPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = Number(params.quizId);
  const { quiz, isLoading, error } = useCommunityQuizDetail(quizId);
  const { eid } = useAuth();

  if (isLoading) {
    return <div className="p-10 text-center dt-text-dim">Loading questions…</div>;
  }

  if (error || !quiz) {
    return <div className="p-10 text-center text-error">{error ?? "Quiz not found."}</div>;
  }

  if (quiz.status !== "subjective_open") {
    return <div className="p-10 text-center dt-text-dim">Subjective round is not currently open.</div>;
  }

  if (!eid) {
    return <div className="p-10 text-center text-error">Employee context required.</div>;
  }

  return (
    <div className="p-[24px_28px] space-y-6">
      <h1 className="text-xl font-semibold">{quiz.title}</h1>
      <p className="text-sm dt-text-dim">Answer the following questions based on the video.</p>
      {quiz.questions?.map((q) => (
        <SubjectiveResponseForm
          key={q.id}
          quizId={quizId}
          question={q}
          eid={eid}
        />
      ))}
    </div>
  );
}
