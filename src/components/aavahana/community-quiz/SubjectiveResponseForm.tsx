"use client";

import { useState } from "react";
import { CommunityQuizService } from "@/lib/services/aavahana/community-quiz.service";
import { toast } from "@/utils";
import type { QuizQuestion } from "@/types/aavahana/community-quiz.types";

interface Props {
  quizId: number;
  question: QuizQuestion;
  eid: number;
  existingAnswer?: string;
  onSubmitted?: () => void;
}

export function SubjectiveResponseForm({ quizId, question, eid, existingAnswer, onSubmitted }: Props) {
  const [answer, setAnswer] = useState(existingAnswer ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error("Please write your answer before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await CommunityQuizService.submitResponse(quizId, question.id, { eid, answer: answer.trim() });
      toast.success(`Answer for Q${question.ordinal} saved`);
      onSubmitted?.();
    } catch {
      toast.error("Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-base-200 border border-base-300 space-y-3">
      <p className="font-medium">{question.ordinal}. {question.text}</p>
      {question.context && (
        <p className="text-xs dt-text-dim italic">{question.context}</p>
      )}
      <textarea
        className="textarea textarea-bordered w-full min-h-[100px]"
        placeholder="Write your interpretation here…"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={submitting}
      />
      <button
        className="btn btn-sm btn-primary"
        onClick={handleSubmit}
        disabled={submitting || !answer.trim()}
      >
        {submitting ? "Saving…" : "Submit Answer"}
      </button>
    </div>
  );
}
