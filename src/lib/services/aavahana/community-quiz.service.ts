import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type { BackendPaginatedResponse } from "@/types/shared/api.types";
import type {
  CommunityQuiz,
  CommunityQuizStatus,
  QuizQuestion,
  QuizResponse,
  QuizMcq,
  QuizMcqAnswer,
  QuizScore,
  QuizAnalytics,
  ExportedResponse,
  CreateQuizPayload,
  AddQuestionsPayload,
  AddMcqsPayload,
  QuizParticipant,
  InviteLinkResponse,
} from "@/types/aavahana/community-quiz.types";

const BASE = "/v3/pdgms/loops/community-quiz";

export class CommunityQuizService {
  static async create(payload: CreateQuizPayload): Promise<ApiResult<CommunityQuiz>> {
    return api.post<CommunityQuiz>(BASE, payload);
  }

  static async list(filters?: {
    programId?: number;
    status?: CommunityQuizStatus;
    createdBy?: number;
    page?: number;
    perPage?: number;
  }): Promise<ApiResult<BackendPaginatedResponse<CommunityQuiz>>> {
    return api.get<BackendPaginatedResponse<CommunityQuiz>>(BASE, filters);
  }

  static async get(quizId: number): Promise<ApiResult<CommunityQuiz>> {
    return api.get<CommunityQuiz>(`${BASE}/${quizId}`);
  }

  static async update(quizId: number, data: Partial<CreateQuizPayload>): Promise<ApiResult<CommunityQuiz>> {
    return api.put<CommunityQuiz>(`${BASE}/${quizId}`, data);
  }

  static async transitionStatus(quizId: number, status: CommunityQuizStatus): Promise<ApiResult<CommunityQuiz>> {
    return api.patch<CommunityQuiz>(`${BASE}/${quizId}/status`, { status });
  }

  static async addQuestions(quizId: number, payload: AddQuestionsPayload): Promise<ApiResult<QuizQuestion[]>> {
    return api.post<QuizQuestion[]>(`${BASE}/${quizId}/questions`, payload);
  }

  static async getResponses(quizId: number): Promise<ApiResult<QuizResponse[]>> {
    return api.get<QuizResponse[]>(`${BASE}/${quizId}/responses`);
  }

  static async submitResponse(quizId: number, questionId: number, data: { eid: number; answer: string }): Promise<ApiResult<QuizResponse>> {
    return api.post<QuizResponse>(`${BASE}/${quizId}/questions/${questionId}/respond`, data);
  }

  static async exportResponses(quizId: number): Promise<ApiResult<ExportedResponse[]>> {
    return api.get<ExportedResponse[]>(`${BASE}/${quizId}/responses/export`);
  }

  static async addMcqs(quizId: number, payload: AddMcqsPayload): Promise<ApiResult<QuizMcq[]>> {
    return api.post<QuizMcq[]>(`${BASE}/${quizId}/mcqs`, payload);
  }

  static async submitMcqAnswer(quizId: number, mcqId: number, data: { eid: number; selectedId: string }): Promise<ApiResult<QuizMcqAnswer>> {
    return api.post<QuizMcqAnswer>(`${BASE}/${quizId}/mcqs/${mcqId}/answer`, data);
  }

  static async getInviteLink(quizId: number): Promise<ApiResult<InviteLinkResponse>> {
    return api.get<InviteLinkResponse>(`${BASE}/${quizId}/invite`);
  }

  static async joinQuiz(quizId: number, data: { eid: number; token: string }): Promise<ApiResult<QuizParticipant>> {
    return api.post<QuizParticipant>(`${BASE}/${quizId}/join`, data);
  }

  static async getParticipants(quizId: number): Promise<ApiResult<QuizParticipant[]>> {
    return api.get<QuizParticipant[]>(`${BASE}/${quizId}/participants`);
  }

  static async updateQuestion(quizId: number, questionId: number, data: Partial<{ text: string; context: string; ordinal: number }>): Promise<ApiResult<QuizQuestion>> {
    return api.put<QuizQuestion>(`${BASE}/${quizId}/questions/${questionId}`, data);
  }

  static async reorderQuestions(quizId: number, order: { id: number; ordinal: number }[]): Promise<ApiResult<QuizQuestion[]>> {
    return api.patch<QuizQuestion[]>(`${BASE}/${quizId}/questions/reorder`, { order });
  }

  static async updateMcq(quizId: number, mcqId: number, data: Partial<{ stem: string; options: import("@/types/aavahana/community-quiz.types").McqOption[]; source: string; ordinal: number }>): Promise<ApiResult<QuizMcq>> {
    return api.put<QuizMcq>(`${BASE}/${quizId}/mcqs/${mcqId}`, data);
  }

  static async reorderMcqs(quizId: number, order: { id: number; ordinal: number }[]): Promise<ApiResult<QuizMcq[]>> {
    return api.patch<QuizMcq[]>(`${BASE}/${quizId}/mcqs/reorder`, { order });
  }

  static async triggerScoring(quizId: number): Promise<ApiResult<QuizScore[]>> {
    return api.post<QuizScore[]>(`${BASE}/${quizId}/score`);
  }

  static async getScores(quizId: number): Promise<ApiResult<QuizScore[]>> {
    return api.get<QuizScore[]>(`${BASE}/${quizId}/scores`);
  }

  static async getAnalytics(quizId: number): Promise<ApiResult<QuizAnalytics>> {
    return api.get<QuizAnalytics>(`${BASE}/${quizId}/analytics`);
  }
}
