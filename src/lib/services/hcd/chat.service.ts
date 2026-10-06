import type { ByokFailureDetail } from "@/types/shared/byok-preflight.types";
import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: number;
  frameworkKey: string;
  status: string;
  createdAt: string;
  lastMessage: string | null;
}

export interface ConversationDetail {
  id: number;
  frameworkKey: string;
  status: string;
  messages: ChatMessage[];
}

export interface StartConversationResult {
  id: number;
  frameworkKey: string;
  status: string;
  createdAt: string;
}

export interface SendMessageResult {
  conversationId: number;
  userMessage: string;
  aiResponse: string | null;
  llmError: string | null;
  /**
   * The structured half of the failure. Present only when the model call failed;
   * `kind: "quota"` is what the provider-switch card fires on. The sentence in
   * `llmError` is unchanged and is still what a person reads.
   */
  llmFailure?: ByokFailureDetail | null;
}

const BASE = "/v3/pdgms/hcd/chat";

export class HcdChatService {
  static async listConversations(): Promise<ApiResult<ConversationSummary[]>> {
    return api.get<ConversationSummary[]>(`${BASE}/conversations`);
  }

  static async startConversation(
    frameworkKey: string
  ): Promise<ApiResult<StartConversationResult>> {
    return api.post<StartConversationResult>(`${BASE}/conversations`, {
      frameworkKey,
    });
  }

  static async getConversation(
    id: number
  ): Promise<ApiResult<ConversationDetail>> {
    return api.get<ConversationDetail>(`${BASE}/conversations/${id}`);
  }

  static async sendMessage(
    conversationId: number,
    message: string,
    byok: { apiKey: string; provider: string; model: string }
  ): Promise<ApiResult<SendMessageResult>> {
    return api.post<SendMessageResult>(
      `${BASE}/conversations/${conversationId}/messages`,
      { message, ...byok }
    );
  }
}
