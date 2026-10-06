"use client";

import { useState } from "react";
import { CommunityQuizService } from "@/lib/services/aavahana/community-quiz.service";
import { toast } from "@/utils";
import type { QuizMcq, McqOption } from "@/types/aavahana/community-quiz.types";

interface Props {
  quizId: number;
  mcq: QuizMcq;
  eid: number;
  existingSelectedId?: string;
  onAnswered?: (mcqId: number, selectedId: string) => void;
}

export function McqAnswerCard({ quizId, mcq, eid, existingSelectedId, onAnswered }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(existingSelectedId ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingSelectedId);

  const handleSubmit = async () => {
    if (!selectedId) {
      toast.error("Select an option first.");
      return;
    }
    setSubmitting(true);
    try {
      await CommunityQuizService.submitMcqAnswer(quizId, mcq.id, { eid, selectedId });
      setSubmitted(true);
      toast.success(`Answer for Q${mcq.ordinal} saved`);
      onAnswered?.(mcq.id, selectedId);
    } catch {
      toast.error("Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border space-y-3 ${submitted ? "bg-base-200 border-success/30" : "bg-base-200 border-base-300"}`}>
      <p className="font-medium">{mcq.ordinal}. {mcq.stem}</p>
      <div className="space-y-2">
        {mcq.options.map((opt: McqOption) => (
          <label
            key={opt.id}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
              selectedId === opt.id ? "bg-primary/10 border border-primary/30" : "hover:bg-base-300"
            } ${submitted ? "pointer-events-none opacity-75" : ""}`}
          >
            <input
              type="radio"
              name={`mcq-${mcq.id}`}
              value={opt.id}
              checked={selectedId === opt.id}
              onChange={() => setSelectedId(opt.id)}
              className="radio radio-sm radio-primary"
              disabled={submitted}
            />
            <span className="text-sm">{opt.text}</span>
          </label>
        ))}
      </div>
      {!submitted && (
        <button
          className="btn btn-sm btn-primary"
          onClick={handleSubmit}
          disabled={submitting || !selectedId}
        >
          {submitting ? "Saving…" : "Lock Answer"}
        </button>
      )}
      {submitted && (
        <p className="text-xs text-success">Answered</p>
      )}
    </div>
  );
}
