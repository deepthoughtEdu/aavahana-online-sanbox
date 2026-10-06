export type CommunityQuizStatus =
  | "draft"
  | "subjective_open"
  | "subjective_closed"
  | "mcq_open"
  | "mcq_closed"
  | "scored"
  | "archived";

export type BaitType =
  | "CORRECT"
  | "VIRTUE_BAIT"
  | "VICE_BAIT"
  | "OVERGENERALIZATION"
  | "EMOTIONAL_APPEAL"
  | "STRAW_MAN"
  | "FALSE_PRECISION"
  | "ASSUMPTION_INJECTION";

export interface McqOption {
  id: string;
  text: string;
  baitType: BaitType;
  isCorrect?: boolean;
}

export interface CommunityQuiz {
  id: number;
  orgId: string;
  programId: number | null;
  createdBy: number;
  title: string;
  description: string | null;
  videoUrl: string | null;
  transcript: string | null;
  cellRef: string | null;
  status: CommunityQuizStatus;
  config: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  questions?: QuizQuestion[];
  mcqs?: QuizMcq[];
  _count?: { questions: number; mcqs: number; scores: number };
}

export interface QuizQuestion {
  id: number;
  quizId: number;
  ordinal: number;
  text: string;
  context: string | null;
}

export interface QuizResponse {
  id: number;
  questionId: number;
  eid: number;
  answer: string;
  submittedAt: string;
  question?: { id: number; ordinal: number; text: string };
}

export interface QuizMcq {
  id: number;
  quizId: number;
  ordinal: number;
  stem: string;
  options: McqOption[];
  source: string | null;
}

export interface QuizMcqAnswer {
  id: number;
  mcqId: number;
  eid: number;
  selectedId: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface QuizScore {
  id: number;
  quizId: number;
  eid: number;
  totalMcqs: number;
  correctCount: number;
  score: number;
  baitAnalysis: Record<string, number> | null;
  scoredAt: string;
}

export interface QuizAnalytics {
  totalParticipants: number;
  averageScore: number;
  baitSusceptibility: Record<string, {
    totalHits: number;
    participantsAffected: number;
    susceptibilityRate: number;
  }>;
}

export interface ExportedResponse {
  eid: number;
  questionOrdinal: number;
  questionText: string;
  answer: string;
  submittedAt: string;
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  programId?: number;
  videoUrl?: string;
  transcript?: string;
  cellRef?: string;
  config?: Record<string, unknown>;
}

export interface AddQuestionsPayload {
  questions: { text: string; context?: string; ordinal?: number }[];
}

export interface AddMcqsPayload {
  mcqs: { stem: string; ordinal?: number; options: McqOption[]; source?: string }[];
}

export interface QuizParticipant {
  id: number;
  quizId: number;
  eid: number;
  joinedAt: string;
}

export interface InviteLinkResponse {
  quizId: number;
  token: string;
  title: string;
}
