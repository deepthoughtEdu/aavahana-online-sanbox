import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  WeeklyTransformationService,
  type PlanQuestions,
  type ReportQuestions,
  type FileConstraintResult,
  type QuestionAnswer,
} from "@/lib/services/aavahana/weekly-transformation.service";
import { isError } from "@/lib/api/client";

export function usePlanQuestions(level?: string) {
  return useQuery<PlanQuestions>({
    queryKey: ["weekly", "plan-questions", level ?? null],
    queryFn: async () => {
      const res = await WeeklyTransformationService.getPlanQuestions(level);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function useReportQuestions(level?: string, weekStart?: string) {
  return useQuery<ReportQuestions>({
    queryKey: ["weekly", "report-questions", level ?? null, weekStart ?? null],
    queryFn: async () => {
      const res = await WeeklyTransformationService.getReportQuestions(level, weekStart);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function useSavePlanAnswers() {
  const qc = useQueryClient();
  return useMutation<
    { id: number; level: string; questionAnswers: QuestionAnswer[] },
    Error,
    { answers: QuestionAnswer[]; weekStart?: string; level?: string }
  >({
    mutationFn: async ({ answers, weekStart, level }) => {
      const res = await WeeklyTransformationService.savePlanAnswers(answers, weekStart, level);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["weekly", "plan-questions", vars.level ?? null] });
    },
  });
}

export function useSaveReportAnswers() {
  const qc = useQueryClient();
  return useMutation<
    { id: number; level: string; questionAnswers: QuestionAnswer[] },
    Error,
    { weekStart: string; answers: QuestionAnswer[]; level?: string }
  >({
    mutationFn: async ({ weekStart, answers, level }) => {
      const res = await WeeklyTransformationService.saveReportAnswers(weekStart, answers, level);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["weekly", "report-questions", null, vars.weekStart] });
    },
  });
}

export function useFileRecurringConstraint() {
  const qc = useQueryClient();
  return useMutation<FileConstraintResult, Error, { level?: string; weeks?: number }>({
    mutationFn: async ({ level, weeks }) => {
      const res = await WeeklyTransformationService.fileRecurringConstraint(level, weeks);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hcd", "initiatives"] });
    },
  });
}
