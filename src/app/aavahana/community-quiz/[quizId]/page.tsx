"use client";

import { useParams } from "next/navigation";
import { useCommunityQuizDetail } from "@/lib/hooks/aavahana/use-community-quiz";
import { QuizDetailHeader } from "@/components/aavahana/community-quiz/QuizDetailHeader";
import { QuizStatusStepper } from "@/components/aavahana/community-quiz/QuizStatusStepper";

export default function CommunityQuizDetailPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = Number(params.quizId);
  const { quiz, isLoading, error } = useCommunityQuizDetail(quizId);

  if (isLoading) {
    return <div className="p-10 text-center dt-text-dim">Loading quiz…</div>;
  }

  if (error || !quiz) {
    return <div className="p-10 text-center text-error">{error ?? "Quiz not found."}</div>;
  }

  return (
    <div className="p-[24px_28px] space-y-6">
      <QuizDetailHeader quiz={quiz} />
      <QuizStatusStepper currentStatus={quiz.status} />
    </div>
  );
}
