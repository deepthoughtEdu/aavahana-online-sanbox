// src/lib/hooks/use-chat-reflection.ts
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "@/utils";
import { useApi, useApiMutation } from "../shared/use-api";
import { ReportService } from "@/lib/services";
import {
  Message,
} from "@/types/aavahana/report.types";

export function useChatReflection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ Fetch chat messages - useApi handles ApiResult automatically
  const {
    data,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useApi({
    queryFn: ReportService.getMessages,
    queryKey: ["chat-messages"],
  });

  // Hydrate from backend data
  useEffect(() => {
    if (data) {
      if (data.conversationId) setConversationId(data.conversationId);
      if (Array.isArray(data.messages)) {
        setMessages(
          data.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            text: msg.text,
            timestamp: msg.timestamp ?? new Date().toISOString(),
          }))
        );
      }
      setIsHydrated(true);
    }
  }, [data]);

  // ✅ Send message mutation - useApiMutation handles ApiResult automatically
  const sendMessageMutation = useApiMutation({
    mutationFn: ReportService.postReflection,
    onSuccess: (data) => {
      const aiResponse = data?.aiResponse;
      if (aiResponse) {
        const assistantMsg: Message = {
          id: Date.now().toString(),
          role: "assistant",
          text: aiResponse,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
    },
    onError: () => {
      toast.error("Failed to send message");
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    },
  });

  const sendMessage = useCallback(
    (userMessage: string) => {
      if (!userMessage.trim() || sendMessageMutation.isPending) return;

      // Optimistically add user message
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        text: userMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      // Send mutation
      sendMessageMutation.mutate({
        message: userMessage,
        conversationId: conversationId ?? undefined,
      });
    },
    [conversationId, sendMessageMutation]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setInput("");
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading: isLoadingMessages || sendMessageMutation.isPending,
    conversationId,
    sendMessage,
    clearChat,
    messagesEndRef,
    isHydrated,
    refetchMessages,
  };
}