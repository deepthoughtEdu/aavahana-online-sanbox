"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { LdiService } from "@/lib/services/aavahana/ldi.service";
import { toast } from "@/utils";
import type {
  LdiSession,
  LdiPitch,
  LdiReflectionBoard,
  LdiSessionAnalytics,
  LdiSessionAttendance,
  LdiTilePalette,
  CreateLdiSessionPayload,
  UpdateLdiSessionPayload,
  CreateLdiPitchPayload,
  SaveTilesPayload,
  CreatePalettePayload,
  LdiSessionListParams,
  LdiSessionStatus,
} from "@/types/aavahana/ldi.types";

const SESSION_LIST_KEY = ["ldi", "sessions"];
const sessionDetailKey = (id: string) => ["ldi", "session", id];
const pitchesKey = (sessionId: string) => ["ldi", "pitches", sessionId];
const BOARD_LIST_KEY = ["ldi", "boards", "mine"];
const boardDetailKey = (id: string) => ["ldi", "board", id];
const palettesKey = (sessionId?: string) => ["ldi", "palettes", sessionId ?? "global"];
const analyticsKey = (sessionId: string) => ["ldi", "analytics", sessionId];

// ── Read hooks ──

export function useLdiSessions(filters?: LdiSessionListParams) {
  const { data, isLoading, error } = useApi({
    queryKey: [...SESSION_LIST_KEY, filters],
    queryFn: () => LdiService.listSessions(filters),
  });

  // The shared useApi already unwraps backend pagination ({items,total,…}) into
  // `data` as a bare array, so read `data` directly (don't reach for `.items`).
  const sessions = (data as LdiSession[] | undefined) ?? [];
  return {
    sessions,
    total: sessions.length,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useLdiSession(id: string | null) {
  const { data, isLoading, error } = useApi({
    queryKey: sessionDetailKey(id!),
    queryFn: () => LdiService.getSession(id!),
    enabled: !!id,
  });

  return {
    session: (data as LdiSession | undefined) ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

// Pass refetchInterval (ms) to live-poll while a session is live, so new
// pitches appear without a manual reload.
export function useLdiPitches(sessionId: string | null, refetchInterval?: number) {
  const { data, isLoading, error } = useApi({
    queryKey: pitchesKey(sessionId!),
    queryFn: () => LdiService.listPitches(sessionId!),
    enabled: !!sessionId,
    refetchInterval: refetchInterval ?? false,
  });

  return {
    pitches: (data as LdiPitch[] | undefined) ?? [],
    isLoading,
    error: error?.message ?? null,
  };
}

export function useLdiMyBoards(params?: { page?: number; perPage?: number }) {
  const { data, isLoading, error } = useApi({
    queryKey: [...BOARD_LIST_KEY, params],
    queryFn: () => LdiService.listMyBoards(params),
  });

  // useApi unwraps backend pagination into `data` as a bare array.
  const boards = (data as LdiReflectionBoard[] | undefined) ?? [];
  return {
    boards,
    total: boards.length,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useLdiBoard(boardId: string | null) {
  const { data, isLoading, error } = useApi({
    queryKey: boardDetailKey(boardId!),
    queryFn: () => LdiService.getBoard(boardId!),
    enabled: !!boardId,
  });

  return {
    board: (data as LdiReflectionBoard | undefined) ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

export function useLdiPalettes(sessionId?: string) {
  const { data, isLoading, error } = useApi({
    queryKey: palettesKey(sessionId),
    queryFn: () => LdiService.listPalettes(sessionId),
  });

  return {
    palettes: (data as LdiTilePalette[] | undefined) ?? [],
    isLoading,
    error: error?.message ?? null,
  };
}

export function useLdiSessionAnalytics(sessionId: string | null) {
  const { data, isLoading, error } = useApi({
    queryKey: analyticsKey(sessionId!),
    queryFn: () => LdiService.getSessionAnalytics(sessionId!),
    enabled: !!sessionId,
  });

  return {
    analytics: (data as LdiSessionAnalytics | undefined) ?? null,
    isLoading,
    error: error?.message ?? null,
  };
}

// ── Write hooks ──

export function useLdiSessionActions(sessionId?: string) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: SESSION_LIST_KEY });
    if (sessionId) {
      queryClient.invalidateQueries({ queryKey: sessionDetailKey(sessionId) });
    }
  }, [queryClient, sessionId]);

  const createMutation = useApiMutation({
    mutationFn: (payload: CreateLdiSessionPayload) => LdiService.createSession(payload),
    onSuccess: () => {
      toast.success("Session created");
      invalidate();
    },
  });

  const updateMutation = useApiMutation({
    mutationFn: (data: { id: string; updates: UpdateLdiSessionPayload }) =>
      LdiService.updateSession(data.id, data.updates),
    onSuccess: () => {
      toast.success("Session updated");
      invalidate();
    },
  });

  const transitionMutation = useApiMutation({
    mutationFn: (data: { id: string; status: LdiSessionStatus }) =>
      LdiService.transitionSession(data.id, data.status),
    onSuccess: () => {
      toast.success("Session status updated");
      invalidate();
    },
  });

  return {
    createSession: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateSession: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    transitionSession: transitionMutation.mutateAsync,
    isTransitioning: transitionMutation.isPending,
  };
}

export function useLdiAttendance(sessionId: string | null, refetchInterval?: number) {
  const { data, isLoading } = useApi({
    queryKey: ["ldi", "attendance", sessionId ?? "none"],
    queryFn: () => LdiService.listAttendance(sessionId!),
    enabled: !!sessionId,
    refetchInterval: refetchInterval ?? false,
  });

  return {
    attendance: (data as LdiSessionAttendance[] | undefined) ?? [],
    isLoading,
  };
}

export function useLdiJoin(sessionId: string) {
  const queryClient = useQueryClient();

  const attendMutation = useApiMutation({
    mutationFn: (sid: string) => LdiService.attend(sid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionDetailKey(sessionId) });
      queryClient.invalidateQueries({ queryKey: ["ldi", "attendance", sessionId] });
    },
  });

  const { mutateAsync } = attendMutation;
  const attend = useCallback(() => mutateAsync(sessionId), [mutateAsync, sessionId]);

  return {
    attend,
    isAttending: attendMutation.isPending,
  };
}

export function useLdiPitchActions(sessionId?: string) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    if (sessionId) {
      queryClient.invalidateQueries({ queryKey: pitchesKey(sessionId) });
    }
  }, [queryClient, sessionId]);

  const createMutation = useApiMutation({
    mutationFn: (payload: CreateLdiPitchPayload) => LdiService.createPitch(payload.sessionId, payload),
    onSuccess: () => {
      toast.success("Pitch submitted");
      invalidate();
    },
  });

  const annotateMutation = useApiMutation({
    mutationFn: (data: { pitchId: string; annotation: string }) =>
      LdiService.annotatePitch(sessionId!, data.pitchId, data.annotation),
    onSuccess: () => {
      toast.success("Annotation saved");
      invalidate();
    },
  });

  return {
    createPitch: createMutation.mutateAsync,
    isCreatingPitch: createMutation.isPending,
    annotatePitch: annotateMutation.mutateAsync,
    isAnnotating: annotateMutation.isPending,
  };
}

export function useLdiBoardActions(boardId?: string) {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BOARD_LIST_KEY });
    if (boardId) {
      queryClient.invalidateQueries({ queryKey: boardDetailKey(boardId) });
    }
  }, [queryClient, boardId]);

  const createMutation = useApiMutation({
    mutationFn: (sessionId: string) => LdiService.createBoard(sessionId),
    onSuccess: () => {
      toast.success("Board created");
      invalidate();
    },
  });

  const saveTilesMutation = useApiMutation({
    mutationFn: (data: { boardId: string; payload: SaveTilesPayload }) =>
      LdiService.saveTiles(data.boardId, data.payload),
    onSuccess: () => {
      invalidate();
    },
  });

  const completeMutation = useApiMutation({
    mutationFn: (id: string) => LdiService.completeBoard(id),
    onSuccess: () => {
      toast.success("Reflection completed!");
      invalidate();
    },
  });

  return {
    createBoard: createMutation.mutateAsync,
    isCreatingBoard: createMutation.isPending,
    saveTiles: saveTilesMutation.mutateAsync,
    isSaving: saveTilesMutation.isPending,
    completeBoard: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
  };
}

export function useLdiPaletteActions() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["ldi", "palettes"] });
  }, [queryClient]);

  const createMutation = useApiMutation({
    mutationFn: (payload: CreatePalettePayload) => LdiService.createPalette(payload),
    onSuccess: () => {
      toast.success("Palette item created");
      invalidate();
    },
  });

  const deactivateMutation = useApiMutation({
    mutationFn: (paletteId: string) => LdiService.deactivatePalette(paletteId),
    onSuccess: () => {
      toast.success("Palette item removed");
      invalidate();
    },
  });

  return {
    createPalette: createMutation.mutateAsync,
    isCreatingPalette: createMutation.isPending,
    deactivatePalette: deactivateMutation.mutateAsync,
    isDeactivating: deactivateMutation.isPending,
  };
}
