import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HcdChatService,
  type ConversationSummary,
  type ConversationDetail,
  type StartConversationResult,
  type SendMessageResult,
} from "@/lib/services/hcd/chat.service";
import { isError } from "@/lib/api/client";

export function useConversationList() {
  return useQuery<ConversationSummary[]>({
    queryKey: ["hcd", "chat", "conversations"],
    queryFn: async () => {
      const res = await HcdChatService.listConversations();
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery<ConversationDetail | null>({
    queryKey: ["hcd", "chat", "conversation", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await HcdChatService.getConversation(id);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    enabled: !!id,
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation<StartConversationResult, Error, string>({
    mutationFn: async (frameworkKey) => {
      const res = await HcdChatService.startConversation(frameworkKey);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hcd", "chat", "conversations"] });
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation<
    SendMessageResult,
    Error,
    {
      conversationId: number;
      message: string;
      apiKey: string;
      provider: string;
      model: string;
    }
  >({
    mutationFn: async ({ conversationId, message, ...byok }) => {
      const res = await HcdChatService.sendMessage(conversationId, message, byok);
      if (isError(res)) throw new Error(res.error.message);
      return res;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["hcd", "chat", "conversation", vars.conversationId],
      });
    },
  });
}
