"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { Section } from "@/components/shared/Section";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { HcdByokSetup } from "@/components/hcd/HcdByokSetup";
import { hcdByokAtom, type HcdByokConfig } from "@/lib/store/hcd/hcd-byok.store";
import { useByokSwitch } from "@/lib/hooks/shared/use-byok-switch";
import { ProviderSwitchCard } from "@/components/shared/byok/ProviderSwitchCard";
import { useBlockList } from "@/lib/hooks/hcd/use-block";
import {
  useConversationList,
  useConversation,
  useStartConversation,
  useSendMessage,
} from "@/lib/hooks/hcd/use-chat";

function ChatWindow({
  conversationId,
  byok,
}: {
  conversationId: number;
  byok: HcdByokConfig;
}) {
  const { data: conversation } = useConversation(conversationId);
  const sendMutation = useSendMessage();
  const [input, setInput] = useState("");
  const [llmError, setLlmError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  // Provider-switch consent. HCD reports a failed model call as a 200 with
  // llmError set (the user's message is already saved), so the classification
  // arrives in the body rather than as a thrown error.
  const byokSwitch = useByokSwitch();
  const [activeByok, setActiveByok] = useState<HcdByokConfig>(byok);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didPrefill = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length, llmError]);

  // Fresh chat: pre-fill a sensible opener. The coach is already grounded in the
  // learner's assessment, so they can just hit Send instead of pasting results.
  useEffect(() => {
    if (didPrefill.current || !conversation) return;
    if (conversation.messages.length === 0) {
      didPrefill.current = true;
      setInput(
        "Coach me on my assessment results — where am I weakest, and what should I practice first?"
      );
    }
  }, [conversation]);

  const doSend = useCallback((message: string) => {
    setLlmError(null);
    setLastFailedMessage(null);
    sendMutation.mutate(
      { conversationId, message, ...activeByok },
      {
        onSuccess: (data) => {
          if (data.llmError) {
            setLlmError(data.llmError);
            setLastFailedMessage(message);
            void byokSwitch.handleFailureDetail(data.llmFailure, {
              provider: activeByok.provider,
              model: activeByok.model,
              payloadChars: message.length,
              surface: "hcd-chat",
            });
          }
        },
        onError: (err) => {
          setLlmError(err.message);
          setLastFailedMessage(message);
        },
      }
    );
  }, [conversationId, activeByok, sendMutation, byokSwitch]);

  const handleProviderSwitch = useCallback(
    async (choice: { provider: string; model: string | null }) => {
      const confirmed = await byokSwitch.confirmSwitch(choice);
      if (!confirmed) return;
      const next = {
        ...activeByok,
        provider: confirmed.provider,
        model: confirmed.model ?? activeByok.model,
      };
      setActiveByok(next);
      setLlmError(null);
      const retry = lastFailedMessage;
      setLastFailedMessage(null);
      if (retry) {
        sendMutation.mutate({ conversationId, message: retry, ...next });
      }
    },
    [byokSwitch, activeByok, lastFailedMessage, sendMutation, conversationId]
  );

  const handleProviderWait = useCallback(() => {
    byokSwitch.close();
  }, [byokSwitch]);

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    const msg = input.trim();
    setInput("");
    doSend(msg);
  };

  const handleRetry = () => {
    if (!lastFailedMessage || sendMutation.isPending) return;
    doSend(lastFailedMessage);
  };

  return (
    <div className="flex flex-col h-[500px] border border-base-300 rounded-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation?.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${
                msg.role === "user" ? "bg-primary text-primary-content" : "bg-base-200"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {sendMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-base-200 rounded-xl px-4 py-2">
              <span className="loading loading-dots loading-xs" />
            </div>
          </div>
        )}
        {byokSwitch.preflight && (
          <div className="mb-3">
            <ProviderSwitchCard
              preflight={byokSwitch.preflight}
              failure={byokSwitch.failure}
              onSwitch={handleProviderSwitch}
              onWait={handleProviderWait}
            />
          </div>
        )}

        {llmError && !byokSwitch.preflight && !sendMutation.isPending && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl px-4 py-2 text-sm bg-error/10 border border-error/30 text-error space-y-2">
              <p className="whitespace-pre-wrap">{llmError}</p>
              {lastFailedMessage && (
                <Button color="error" variant="outline" size="xs" onClick={handleRetry}>
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-base-300 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="input input-bordered input-sm flex-1"
          disabled={sendMutation.isPending}
        />
        <Button
          color="primary"
          size="sm"
          loading={sendMutation.isPending}
          disabled={!input.trim()}
          onClick={handleSend}
        >
          Send
        </Button>
      </div>
    </div>
  );
}

export function HcdChat() {
  const { data: blocks } = useBlockList();
  const { data: existingConversations } = useConversationList();
  const [byok] = useAtom(hcdByokAtom);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const startMutation = useStartConversation();
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);

  const frameworks = blocks
    ? [...new Map(blocks.map((b) => [b.frameworkKey, b.frameworkName])).entries()]
    : [];

  const frameworkNames = new Map(frameworks);

  const handleStart = async (frameworkKey: string) => {
    setSelectedFramework(frameworkKey);
    const result = await startMutation.mutateAsync(frameworkKey);
    setConversationId(result.id);
  };

  let body: React.ReactNode;

  if (!byok) {
    body = <HcdByokSetup />;
  } else if (conversationId) {
    body = (
      <div className="space-y-3">
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          className="gap-1"
          iconBefore={<span className="text-lg leading-none">&larr;</span>}
          onClick={() => {
            setConversationId(null);
            setSelectedFramework(null);
          }}
        >
          Back
        </Button>
        <ChatWindow conversationId={conversationId} byok={byok} />
      </div>
    );
  } else {
    body = (
      <div className="space-y-6">
        {existingConversations && existingConversations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide dt-text-dim">
              Resume conversation
            </h4>
            <div className="space-y-1">
              {existingConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setConversationId(c.id)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-base-300 hover:bg-base-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-black">
                      {frameworkNames.get(c.frameworkKey) || c.frameworkKey}
                    </span>
                    <span className="text-xs dt-text-dim">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {c.lastMessage && (
                    <p className="text-xs dt-text-dim mt-0.5 truncate">{c.lastMessage}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide dt-text-dim">
            Start new chat
          </h4>
          {frameworks.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {frameworks.map(([key, name]) => (
                <Button
                  key={key}
                  color="neutral"
                  variant="outline"
                  size="sm"
                  loading={startMutation.isPending && selectedFramework === key}
                  onClick={() => handleStart(key)}
                >
                  {name}
                </Button>
              ))}
            </div>
          ) : (
            <EmptyState size="sm" title="No frameworks yet" subtitle="Seed HCD content first." />
          )}
        </div>
      </div>
    );
  }

  return (
    <Section>
      <Section.Header
        title="AI coaching"
        subtitle="Bring your own key (Anthropic, OpenAI, or Gemini) for grounded coaching. Keys are never stored."
      />
      <Section.Body>{body}</Section.Body>
    </Section>
  );
}
