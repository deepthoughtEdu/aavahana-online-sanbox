"use client";

import type { CommunityQuizStatus } from "@/types/aavahana/community-quiz.types";

const STEPS: { status: CommunityQuizStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "subjective_open", label: "Subjective" },
  { status: "subjective_closed", label: "Review" },
  { status: "mcq_open", label: "MCQ" },
  { status: "mcq_closed", label: "Closed" },
  { status: "scored", label: "Scored" },
];

const STATUS_ORDER: CommunityQuizStatus[] = STEPS.map((s) => s.status);

interface Props {
  currentStatus: CommunityQuizStatus;
}

export function QuizStatusStepper({ currentStatus }: Props) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <ul className="steps steps-horizontal w-full text-xs">
      {STEPS.map((step, idx) => (
        <li
          key={step.status}
          className={`step ${idx <= currentIndex ? "step-primary" : ""}`}
        >
          {step.label}
        </li>
      ))}
    </ul>
  );
}
