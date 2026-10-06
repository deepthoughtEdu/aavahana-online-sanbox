"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketManager } from "@/lib/socket/socket.manager";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import type { CommunityQuizStatus } from "@/types/aavahana/community-quiz.types";

interface QuizStatusChangedEvent {
  quizId: number;
  fromStatus: CommunityQuizStatus;
  toStatus: CommunityQuizStatus;
}

interface ParticipantJoinedEvent {
  quizId: number;
  eid: number;
  joinedAt: string;
}

export function useQuizSocket(quizId: number | null) {
  const { isAuthenticated, selectedOrg } = useAuth();
  const orgId = selectedOrg?.orgId;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!quizId || !isAuthenticated || !socketManager) return;

    let socket: import("socket.io-client").Socket | null = null;
    let cancelled = false;

    const onStatusChanged = (data: QuizStatusChangedEvent) => {
      if (data.quizId !== quizId) return;
      queryClient.invalidateQueries({ queryKey: ["community-quiz", "detail", quizId] });
    };

    const onParticipantJoined = (data: ParticipantJoinedEvent) => {
      if (data.quizId !== quizId) return;
      queryClient.invalidateQueries({ queryKey: ["community-quiz", "participants", quizId] });
    };

    socketManager.connect(orgId).then((s) => {
      if (cancelled) return;
      socket = s;

      socket.emit("pdgms.quiz.join", { quizId }, () => {});

      socket.on("event:pdgms.quiz.statusChanged", onStatusChanged);
      socket.on("event:pdgms.quiz.participantJoined", onParticipantJoined);
    });

    return () => {
      cancelled = true;
      if (socket) {
        socket.emit("pdgms.quiz.leave", { quizId }, () => {});
        socket.off("event:pdgms.quiz.statusChanged", onStatusChanged);
        socket.off("event:pdgms.quiz.participantJoined", onParticipantJoined);
      }
    };
  }, [quizId, isAuthenticated, orgId, queryClient]);
}
