"use client";

import Link from "next/link";
import type { CommunityQuiz } from "@/types/aavahana/community-quiz.types";

interface Props {
  quiz: CommunityQuiz;
}

export function QuizDetailHeader({ quiz }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs dt-text-dim mb-2">
        <Link href="/aavahana/community-quiz" className="hover:underline">
          Community Quiz
        </Link>
        <span>/</span>
        <span>{quiz.title}</span>
      </div>

      <h1 className="text-xl font-semibold">{quiz.title}</h1>
      {quiz.description && <p className="text-sm dt-text-dim mt-1">{quiz.description}</p>}

      <div className="flex items-center gap-3 mt-3">
        {quiz.videoUrl && (
          <a href={quiz.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-outline">
            Watch Video
          </a>
        )}
        <Link href={`/aavahana/community-quiz/${quiz.id}/manage`} className="btn btn-xs btn-primary">
          Manage
        </Link>
        <Link href={`/aavahana/community-quiz/${quiz.id}/scores`} className="btn btn-xs btn-ghost">
          Scores
        </Link>
        <Link href={`/aavahana/community-quiz/${quiz.id}/analytics`} className="btn btn-xs btn-ghost">
          Analytics
        </Link>
      </div>
    </div>
  );
}
