// components/daily-report/ChatReflectionModal.tsx
"use client";

import { SparklesIcon, SendIcon, MessageCircleIcon } from "@/components/shared/icons";
import { useEffect, useRef } from "react";
import { useChatReflection } from "@/lib/hooks/aavahana/use-chat-reflection";
import { useSpeechRecognition } from "@/lib/hooks/shared/use-speech-recognition";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { IconBox } from "@/components/shared/IconBox";
import { MicIcon } from "@/components/shared/icons";
import { cn } from "@/utils";

import {
  sizes,
  transitions,
  bgColors,
  borderRadius,
  textColors,
} from "@/utils/shared/design.utils";

interface ChatReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText: (text: string) => void;
}

export function ChatReflectionModal({
  isOpen,
  onClose,
  onInsertText,
}: ChatReflectionModalProps) {
  const { messages, input, setInput, isLoading, sendMessage, messagesEndRef } =
    useChatReflection();

  const {
    isRecording,
    transcript,
    toggleRecording,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [input]);

  // Update input with transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript, setInput]);

  const handleSend = async () => {
    if (input.trim()) {
      await sendMessage(input);
      resetTranscript();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Modal
      size="md"
      isOpen={isOpen}
      onClose={onClose}
      title="AI Report Assistant"
      subtitle="Let me help you craft your daily report"
      icon={<MessageCircleIcon size="lg" />}
      className="h-[90vh] flex flex-col"
      footer={
        <div className="flex items-end gap-2">
          {/* Textarea Container with Voice Button */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here..."
              className={cn(
                "w-full px-4 py-3 pr-12",
                "textarea textarea-bordered resize-none",
                "focus:textarea-primary",
                "min-h-12 max-h-[120px]",
                sizes.sm.text,
                sizes.lg.rounded,
                transitions.normal
              )}
              disabled={isLoading}
              rows={1}
            />

            {/* Voice Button */}
            {isSupported && (
              <Button
                variant="ghost"
                color="secondary"
                iconBefore={<MicIcon size="sm" />}
                className={cn(
                  "absolute right-2 bottom-1",
                  "flex items-center justify-center hover:border-primary w-10 h-10 hover:text-primary",
                  transitions.normal,
                  borderRadius.rounded,
                  isRecording
                    ? [
                        "voice-ripple-animation",
                        bgColors.accent,
                        textColors.primary,
                      ]
                    : textColors.secondary
                )}
                onClick={() => toggleRecording(input)}
                title={isRecording ? "Stop recording" : "Start voice input"}
                disabled={isLoading}
              />
            )}
          </div>

          {/* Send Button */}
          <Button
            size="lg"
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            loading={isLoading}
            iconBefore={!isLoading && <SendIcon size="sm" />}
            className="h-[48px] min-h-[48px]"
          >
            Send
          </Button>
        </div>
      }
    >
      {/* Chat Messages - Scrollable Content */}
      <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="chat chat-start mb-4">
            <div className="chat-image avatar">
              <IconBox icon="AI" color="primary" size="sm" shape="rounded" />
            </div>
            <div
              className={cn(
                "chat-bubble max-w-md",
                sizes.sm.text,
                sizes.sm.padding
              )}
            >
              👋 Hi! I&apos;m here to help you reflect on your day.
              <br />
              <br />
              Tell me about:
              <br />
              • What you worked on today
              <br />
              • Challenges you faced
              <br />
              • What you learned
              <br />• Your wins and accomplishments
            </div>
          </div>
        )}

        {/* Conversation Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "mb-4",
              message.role === "user" ? "chat chat-end" : "chat chat-start"
            )}
          >
            <div className="chat-image avatar">
              {message.role === "assistant" ? (
                <IconBox icon="AI" color="primary" size="sm" shape="rounded" />
              ) : (
                <IconBox icon="You" color="neutral" size="sm" shape="rounded" />
              )}
            </div>
            <div
              className={cn(
                "chat-bubble max-w-lg",
                sizes.sm.text,
                sizes.sm.padding,
                message.role === "assistant"
                  ? "chat-bubble"
                  : "chat-bubble-primary"
              )}
            >
              {message.text}

              {/* Insert Button for User messages */}
              {message.role === "user" && (
                <div className="mt-2 pt-2 border-t border-current/20">
                  <Button
                    size="xs"
                    variant="ghost"
                    color="primary"
                    onClick={() => onInsertText(message.text)}
                    iconBefore={<SparklesIcon size="xs" />}
                  >
                    Insert into reflection
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading State */}
        {isLoading && (
          <div className="chat chat-start mb-4">
            <div className="chat-image avatar">
              <IconBox icon="AI" color="primary" size="sm" shape="rounded" />
            </div>
            <div
              className={cn(
                "chat-bubble max-w-xs",
                sizes.sm.text,
                sizes.sm.padding
              )}
            >
              <span className="loading loading-dots loading-sm"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </Modal>
  );
}
