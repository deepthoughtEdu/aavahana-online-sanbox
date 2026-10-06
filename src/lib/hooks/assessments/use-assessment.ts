"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { AssessmentService } from "@/lib/services/assessments/assessment.service";
import type {
  AssessmentInstanceResponse,
} from "@/types/assessments/assessment.types";
import type { AssessmentPersistence } from "@/components/reflective-assessment/types";

interface UseAssessmentOptions {
  contextType?: string;
  contextId?: number;
  autoCreate?: boolean;
  metadata?: Record<string, unknown>;
}

const KEYS = {
  instance: (id: number) => ["assessment", "instance", id],
  mine: (schema: string, ctx?: string) => ["assessment", "mine", schema, ctx],
};

export function useAssessment(
  schemaKey: string,
  options: UseAssessmentOptions = {}
): AssessmentPersistence & {
  instance: AssessmentInstanceResponse | null;
  status: string | null;
} {
  const { contextType, contextId, autoCreate = false, metadata } = options;
  const queryClient = useQueryClient();
  const didAutoCreate = useRef(false);

  const listKey = KEYS.mine(schemaKey, contextType);

  const { data: instances, isLoading: listLoading } = useApi({
    queryKey: listKey,
    queryFn: () => AssessmentService.listMine({ schemaKey, contextType }),
  });

  const instanceList = (
    Array.isArray(instances) ? instances : []
  ) as AssessmentInstanceResponse[];

  const matched = instanceList.find(
    (i) =>
      i.schemaKey === schemaKey &&
      (contextType ? i.contextType === contextType : true) &&
      (contextId != null ? i.contextId === contextId : true)
  );

  const instanceId = matched?.id ?? null;

  const { data: fullInstance, isLoading: instanceLoading } = useApi({
    queryKey: instanceId ? KEYS.instance(instanceId) : ["assessment", "noop"],
    queryFn: () => AssessmentService.getInstance(instanceId!),
    enabled: !!instanceId,
  });

  const instance = (fullInstance as AssessmentInstanceResponse) ?? null;

  const createMutation = useApiMutation({
    mutationFn: AssessmentService.findOrCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  useEffect(() => {
    if (!autoCreate || listLoading || didAutoCreate.current || matched) return;
    didAutoCreate.current = true;
    createMutation.mutateAsync({
      schemaKey,
      contextType,
      contextId,
      metadata,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCreate, listLoading, matched, schemaKey, contextType, contextId]);

  const respondMutation = useApiMutation({
    mutationFn: (payload: { activityId: number; choices: Record<string, unknown>; explanation?: string }) =>
      AssessmentService.submitResponse(instanceId!, payload),
    onSuccess: () => {
      if (instanceId) {
        queryClient.invalidateQueries({ queryKey: KEYS.instance(instanceId) });
      }
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  // Memoize the restored answers on the instance identity. Returning a fresh
  // array every render made the engine's hydration effect (which depends on it)
  // re-run on each parent render, compounding the remount churn this hook's
  // invalidations already trigger on every answer submit.
  const savedActivities = useMemo(
    () =>
      (instance?.responses ?? []).map((r) => ({
        activityId: r.activityId,
        choices: r.choices,
        explanation: r.explanation,
      })),
    [instance]
  );

  return {
    activities: savedActivities,
    isLoading: listLoading || instanceLoading,
    submitActivity: async (payload) => {
      if (!instanceId) return;
      await respondMutation.mutateAsync({
        activityId: payload.activityId,
        choices: payload.choices,
        explanation: payload.explanation,
      });
    },
    instance,
    status: instance?.status ?? null,
  };
}
