"use client";

import { useParams } from "next/navigation";
import { useCommunityQuizDetail } from "@/lib/hooks/aavahana/use-community-quiz";
import { McqAnswerCard } from "@/components/aavahana/community-quiz/McqAnswerCard";
import { useAuth } from "@/lib/hooks/shared/use-auth";

export default function CommunityQuizMcqPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = Number(params.quizId);
  const { quiz, isLoading, error } = useCommunityQuizDetail(quizId);
  const { eid } = useAuth();

  if (isLoading) {
    return <div className="p-10 text-center dt-text-dim">Loading MCQs…</div>;
  }

  if (error || !quiz) {
    return <div className="p-10 text-center text-error">{error ?? "Quiz not found."}</div>;
  }

  if (quiz.status !== "mcq_open") {
    return <div className="p-10 text-center dt-text-dim">MCQ round is not currently open.</div>;
  }

  if (!eid) {
    return <div className="p-10 text-center text-error">Employee context required.</div>;
  }

  return (
    <div className="p-[24px_28px] space-y-6">
      <h1 className="text-xl font-semibold">{quiz.title} — MCQ Round</h1>
      <p className="text-sm dt-text-dim">Select the correct interpretation for each question. Once you lock an answer, it cannot be changed.</p>
      {quiz.mcqs?.map((mcq) => (
        <McqAnswerCard
          key={mcq.id}
          quizId={quizId}
          mcq={mcq}
          eid={eid}
        />
      ))}
    </div>
  );
}
