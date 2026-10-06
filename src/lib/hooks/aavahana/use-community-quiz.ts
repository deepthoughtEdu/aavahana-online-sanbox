"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { CommunityQuizService } from "@/lib/services/aavahana/community-quiz.service";
import { toast } from "@/utils";
import type {
  CommunityQuiz,
  CommunityQuizStatus,
  QuizResponse,
  QuizScore,
  QuizAnalytics,
  CreateQuizPayload,
  AddQuestionsPayload,
  AddMcqsPayload,
  QuizParticipant,
  InviteLinkResponse,
  McqOption,
} from "@/types/aavahana/community-quiz.types";
import type { BackendPaginatedResponse } from "@/types/shared/api.types";

const QUIZ_LIST_KEY = ["community-quiz", "list"];
const quizDetailKey = (id: number) => ["community-quiz", "detail", id];
const quizScoresKey = (id: number) => ["community-quiz", "scores", id];
const quizAnalyticsKey = (id: number) => ["community-quiz", "analytics", id];
const quizResponsesKey = (id: number) => ["community-quiz", "responses", id];
const quizParticipantsKey = (id: number) => ["community-quiz", "participants", id];

interface UseQuizListFilters {
  programId?: number;
  status?: CommunityQuizStatus;
  createdBy?: number;
  page?: number;
  perPage?: number;
}

export function useCommunityQuizList(filters?: UseQuizListFilters) {
  const { data, isLoading, error } = useApi({
    queryKey: [...QUIZ_LIST_KEY, filters],
    queryFn: () => CommunityQuizService.list(filters),
    enabled: true,
  });

  return {
    quizzes: (data as BackendPaginatedResponse<CommunityQuiz> | undefined)?.items ?? [],
    total: (data as BackendPaginatedResponse<CommunityQuiz> | undefined)?.total ?? 0,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useCommunityQuizDetail(quizId: number | null) {
  const { data, isLoading, error } = useApi({
    queryKey: quizDetailKey(quizId!),
    queryFn: () => CommunityQuizService.get(quizId!),
    enabled: !!quizId,
  });

  return {
    quiz: (data as CommunityQuiz | undefined) ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useCommunityQuizActions(quizId?: number) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUIZ_LIST_KEY });
    if (quizId) {
      queryClient.invalidateQueries({ queryKey: quizDetailKey(quizId) });
    }
  }, [queryClient, quizId]);

  const createMutation = useApiMutation({
    mutationFn: (payload: CreateQuizPayload) => CommunityQuizService.create(payload),
    onSuccess: () => {
      toast.success("Quiz created");
      invalidate();
    },
  });

  const updateMutation = useApiMutation({
    mutationFn: (data: { quizId: number; updates: Partial<CreateQuizPayload> }) =>
      CommunityQuizService.update(data.quizId, data.updates),
    onSuccess: () => {
      toast.success("Quiz updated");
      invalidate();
    },
  });

  const transitionMutation = useApiMutation({
    mutationFn: (data: { quizId: number; status: CommunityQuizStatus }) =>
      CommunityQuizService.transitionStatus(data.quizId, data.status),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
  });

  const addQuestionsMutation = useApiMutation({
    mutationFn: (data: { quizId: number; payload: AddQuestionsPayload }) =>
      CommunityQuizService.addQuestions(data.quizId, data.payload),
    onSuccess: () => {
      toast.success("Questions added");
      invalidate();
    },
  });

  const addMcqsMutation = useApiMutation({
    mutationFn: (data: { quizId: number; payload: AddMcqsPayload }) =>
      CommunityQuizService.addMcqs(data.quizId, data.payload),
    onSuccess: () => {
      toast.success("MCQs added");
      invalidate();
    },
  });

  const scoreMutation = useApiMutation({
    mutationFn: (id: number) => CommunityQuizService.triggerScoring(id),
    onSuccess: () => {
      toast.success("Scoring complete");
      invalidate();
      if (quizId) {
        queryClient.invalidateQueries({ queryKey: quizScoresKey(quizId) });
      }
    },
  });

  const updateQuestionMutation = useApiMutation({
    mutationFn: (data: { quizId: number; questionId: number; updates: Partial<{ text: string; context: string; ordinal: number }> }) =>
      CommunityQuizService.updateQuestion(data.quizId, data.questionId, data.updates),
    onSuccess: () => {
      toast.success("Question updated");
      invalidate();
    },
  });

  const reorderQuestionsMutation = useApiMutation({
    mutationFn: (data: { quizId: number; order: { id: number; ordinal: number }[] }) =>
      CommunityQuizService.reorderQuestions(data.quizId, data.order),
    onSuccess: () => invalidate(),
  });

  const updateMcqMutation = useApiMutation({
    mutationFn: (data: { quizId: number; mcqId: number; updates: Partial<{ stem: string; options: McqOption[]; source: string; ordinal: number }> }) =>
      CommunityQuizService.updateMcq(data.quizId, data.mcqId, data.updates),
    onSuccess: () => {
      toast.success("MCQ updated");
      invalidate();
    },
  });

  const reorderMcqsMutation = useApiMutation({
    mutationFn: (data: { quizId: number; order: { id: number; ordinal: number }[] }) =>
      CommunityQuizService.reorderMcqs(data.quizId, data.order),
    onSuccess: () => invalidate(),
  });

  const joinQuizMutation = useApiMutation({
    mutationFn: (data: { quizId: number; eid: number; token: string }) =>
      CommunityQuizService.joinQuiz(data.quizId, { eid: data.eid, token: data.token }),
    onSuccess: () => {
      toast.success("Joined quiz");
      invalidate();
      if (quizId) {
        queryClient.invalidateQueries({ queryKey: quizParticipantsKey(quizId) });
      }
    },
  });

  return {
    createQuiz: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateQuiz: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    transitionStatus: transitionMutation.mutateAsync,
    isTransitioning: transitionMutation.isPending,
    addQuestions: addQuestionsMutation.mutateAsync,
    isAddingQuestions: addQuestionsMutation.isPending,
    addMcqs: addMcqsMutation.mutateAsync,
    isAddingMcqs: addMcqsMutation.isPending,
    triggerScoring: scoreMutation.mutateAsync,
    isScoring: scoreMutation.isPending,
    updateQuestion: updateQuestionMutation.mutateAsync,
    isUpdatingQuestion: updateQuestionMutation.isPending,
    reorderQuestions: reorderQuestionsMutation.mutateAsync,
    updateMcq: updateMcqMutation.mutateAsync,
    isUpdatingMcq: updateMcqMutation.isPending,
    reorderMcqs: reorderMcqsMutation.mutateAsync,
    joinQuiz: joinQuizMutation.mutateAsync,
    isJoining: joinQuizMutation.isPending,
  };
}

export function useCommunityQuizResponses(quizId: number | null) {
  const { data, isLoading, error } = useApi({
    queryKey: quizResponsesKey(quizId!),
    queryFn: () => CommunityQuizService.getResponses(quizId!),
    enabled: !!quizId,
  });

  return {
    responses: (data as QuizResponse[] | undefined) ?? [],
    isLoading,
    error: error?.message ?? null,
  };
}

export function useCommunityQuizScores(quizId: number | null) {
  const { data, isLoading, error } = useApi({
    queryKey: quizScoresKey(quizId!),
    queryFn: () => CommunityQuizService.getScores(quizId!),
    enabled: !!quizId,
  });

  return {
    scores: (data as QuizScore[] | undefined) ?? [],
    isLoading,
    error: error?.message ?? null,
  };
}

export function useCommunityQuizAnalytics(quizId: number | null) {
  const { data, isLoading, error } = useApi({
    queryKey: quizAnalyticsKey(quizId!),
    queryFn: () => CommunityQuizService.getAnalytics(quizId!),
    enabled: !!quizId,
  });

  return {
    analytics: (data as QuizAnalytics | undefined) ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useCommunityQuizParticipants(quizId: number | null) {
  const { data, isLoading, error } = useApi({
    queryKey: quizParticipantsKey(quizId!),
    queryFn: () => CommunityQuizService.getParticipants(quizId!),
    enabled: !!quizId,
  });

  return {
    participants: (data as QuizParticipant[] | undefined) ?? [],
    isLoading,
    error: error?.message ?? null,
  };
}

export function useCommunityQuizInvite(quizId: number | null) {
  const { data, isLoading, error } = useApi({
    queryKey: ["community-quiz", "invite", quizId!],
    queryFn: () => CommunityQuizService.getInviteLink(quizId!),
    enabled: !!quizId,
  });

  return {
    invite: (data as InviteLinkResponse | undefined) ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}
