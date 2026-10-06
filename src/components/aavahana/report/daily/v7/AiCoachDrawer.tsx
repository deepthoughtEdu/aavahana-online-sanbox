"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAtomValue, useSetAtom } from "jotai";
import { SparklesIcon } from "@/components/shared/icons";
import { useV7Coach, useV7CoachSend } from "@/lib/hooks/aavahana/use-report-v7";
import {
  byokConfigAtom,
  normalizeByokModel,
} from "@/lib/store/shared/byok.store";
import { isError } from "@/lib/api/client";
import { buildDraftSnapshot, engineAtom } from "@/lib/engine/tree-walker";
import { currentNodeAtom } from "@/lib/engine/tree-walker";
import { cn } from "@/utils";
import { useByokSwitch } from "@/lib/hooks/shared/use-byok-switch";
import { ProviderSwitchCard } from "@/components/shared/byok/ProviderSwitchCard";
import type { V7CoachMessage } from "@/types/aavahana/report-v7.types";

interface AiCoachDrawerProps {
  date: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Sliding chat panel for the in-flow Socratic coach. Renders on top of the
 * daily-report screen — does not replace the conversation, the user can scroll
 * back to it any time.
 *
 * Loads today's coach thread on mount; each send appends a turn to the same
 * conversation so the AI has memory across the day. Draft snapshot + current
 * node are sent on every turn so the AI can probe specifics ("you marked X as
 * partial — what's still in the way?").
 */
export function AiCoachDrawer({ date, open, onClose }: AiCoachDrawerProps) {
  const byokConfig = useAtomValue(byokConfigAtom);
  const setByokConfig = useSetAtom(byokConfigAtom);
  // Provider-switch consent (D-2: always ask). Only a real quota exhaustion
  // opens the card — a bad key or an overloaded provider keeps its own message.
  const byokSwitch = useByokSwitch();
  const [pendingText, setPendingText] = React.useState<string | null>(null);
  const engineState = useAtomValue(engineAtom);
  const currentNode = useAtomValue(currentNodeAtom);
  const { data, isLoading, refetch } = useV7Coach(date);
  const { mutate: sendMessage, isPending: sending } = useV7CoachSend();

  // Local messages mirror the server thread but accept optimistic
  // user-message appends so the input doesn't feel laggy.
  const [localMessages, setLocalMessages] = useState<V7CoachMessage[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync server thread → local on every refetch.
  useEffect(() => {
    if (data?.messages) {
      setLocalMessages(data.messages);
    }
  }, [data?.messages]);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, localMessages.length, sending]);

  // Focus input when drawer opens.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const hasByok = Boolean(
    byokConfig.apiKey && byokConfig.provider && byokConfig.model,
  );

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || sending || !hasByok) return;

    // Optimistic append.
    const optimisticUser: V7CoachMessage = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optimisticUser]);
    setDraft("");

    // Pull a fresh draft snapshot — every send gets up-to-date context.
    const snapshot = buildDraftSnapshot(engineState) as unknown as Record<
      string,
      unknown
    >;

    sendMessage(
      {
        date,
        message: text,
        draft: snapshot,
        currentNodeId: engineState.currentNodeId ?? null,
        currentNodeText: currentNode?.text ?? null,
        apiKey: byokConfig.apiKey,
        provider: byokConfig.provider,
        model: normalizeByokModel(byokConfig.model),
      },
      {
        onSuccess: (result) => {
          if (result && !isError(result)) {
            // Append the AI reply directly so the user doesn't wait for the
            // refetch round-trip.
            setLocalMessages((prev) => [...prev, result.aiMessage]);
            refetch();
          }
        },
        onError: (error) => {
          // Rollback the optimistic append on hard failure.
          setLocalMessages((prev) =>
            prev.filter((m) => m.id !== optimisticUser.id),
          );
          // Out of quota is a different problem from a failed message: offer
          // somewhere else to send it rather than just losing the turn.
          setPendingText(text);
          void byokSwitch.handleFailure(error, {
            provider: byokConfig.provider,
            model: normalizeByokModel(byokConfig.model),
            payloadChars: text.length + localMessages.reduce((sum, m) => sum + (m.text?.length ?? 0), 0),
            surface: "daily-report-chat",
          });
        },
      },
    );
  }, [
    draft,
    sending,
    hasByok,
    engineState,
    currentNode,
    byokConfig,
    date,
    sendMessage,
    refetch,
    byokSwitch,
    localMessages,
  ]);

  const handleProviderSwitch = useCallback(
    async (choice: { provider: string; model: string | null }) => {
      const confirmed = await byokSwitch.confirmSwitch(choice);
      if (!confirmed) return;
      const model = normalizeByokModel(confirmed.model ?? byokConfig.model);
      setByokConfig({ ...byokConfig, provider: confirmed.provider, model });
      const text = pendingText;
      setPendingText(null);
      if (!text) return;
      // Re-send the turn that was lost, on the newly chosen provider.
      sendMessage({
        date,
        message: text,
        draft: buildDraftSnapshot(engineState) as unknown as Record<string, unknown>,
        currentNodeId: engineState.currentNodeId ?? null,
        currentNodeText: currentNode?.text ?? null,
        apiKey: byokConfig.apiKey,
        provider: confirmed.provider,
        model,
      });
    },
    [byokSwitch, byokConfig, setByokConfig, pendingText, sendMessage, date, engineState, currentNode]
  );

  const handleProviderWait = useCallback(() => {
    byokSwitch.close();
    setPendingText(null);
  }, [byokSwitch]);

  const messages = useMemo(() => localMessages, [localMessages]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim — click to close. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/30"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-40 flex h-dvh w-full max-w-md flex-col bg-base-100 shadow-2xl"
            role="dialog"
            aria-label="Reflection coach"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-base-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <SparklesIcon size="sm" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-base-content">
                    Reflection coach
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-base-content/40">
                    Socratic · in-flow
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Close coach"
              >
                ✕
              </button>
            </header>

            {/* BYOK gate */}
            {!hasByok && (
              <div className="border-b border-base-200 bg-warning/10 px-4 py-3 text-xs text-warning-content/80">
                Set up your AI provider key (top-right AI chip) to talk to the
                coach. The coach uses the same key as the post-submission AI
                feedback.
              </div>
            )}

            {/* Message list */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-base-content/40">
                  Loading conversation…
                </div>
              ) : messages.length === 0 ? (
                <EmptyState />
              ) : (
                <ul className="flex flex-col gap-3">
                  {messages.map((m) => (
                    <ChatBubble key={m.id} message={m} />
                  ))}
                  {sending && <TypingIndicator />}
                </ul>
              )}

              {byokSwitch.preflight && (
                <div className="mt-3">
                  <ProviderSwitchCard
                    preflight={byokSwitch.preflight}
                    failure={byokSwitch.failure}
                    onSwitch={handleProviderSwitch}
                    onWait={handleProviderWait}
                  />
                </div>
              )}
            </div>

            {/* Input */}
            <footer className="border-t border-base-200 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                  disabled={!hasByok || sending}
                  placeholder={
                    hasByok
                      ? "What are you stuck on? (Enter to send · Shift+Enter for newline)"
                      : "Set up your AI key first"
                  }
                  className="textarea textarea-bordered flex-1 resize-none text-sm leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!hasByok || sending || draft.trim().length === 0}
                  className="btn btn-primary btn-sm"
                >
                  {sending ? "…" : "Send"}
                </button>
              </div>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ChatBubble({ message }: { message: V7CoachMessage }) {
  const isUser = message.role === "user";
  return (
    <li className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-content"
            : "bg-base-200 text-base-content/90",
        )}
      >
        {message.text}
      </div>
    </li>
  );
}

function TypingIndicator() {
  return (
    <li className="flex justify-start">
      <div className="rounded-2xl bg-base-200 px-3.5 py-2.5">
        <span className="loading loading-dots loading-sm text-base-content/50" />
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <SparklesIcon size="md" />
      <p className="text-sm font-medium text-base-content/70">
        Want help thinking through today?
      </p>
      <p className="text-xs leading-relaxed text-base-content/55">
        Ask the coach a question about a task, a blocker, or how to write
        something more concretely. It can see today&apos;s draft.
      </p>
    </div>
  );
}

/**
 * Floating sparkle button — opens the coach drawer. Renders a small unread
 * badge if there's existing chat history the user hasn't dismissed.
 */
export function AiCoachLauncher({
  hasUnread,
  onClick,
}: {
  hasUnread: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Stacked ABOVE the TourHelpButton (which owns the bottom-right corner).
      // Tour button is btn-md (≈40px) on mobile + bottom-4 / btn-lg (≈56px) on
      // sm+ + bottom-6 — clearance below the AI coach is sized so it never
      // collides regardless of breakpoint.
      className="fixed bottom-20 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-content shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 sm:bottom-24 sm:right-6"
      aria-label="Open reflection coach"
    >
      <SparklesIcon size="md" />
      {hasUnread && (
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-warning ring-2 ring-base-100" />
      )}
    </button>
  );
}
