// components/daily-report/FrameworkModal.tsx
"use client";

import { useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/lib/hooks/shared/use-speech-recognition";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { cn } from "@/utils";
import {
  bgColors,
  borderRadius,
  textColors,
  transitions,
} from "@/utils/shared/design.utils";
import { LightbulbIcon, MicIcon } from "@/components/shared/icons";

// Backend rejects framework reflections shorter than this — surfaced inline
// so the user sees a "minimum needed" hint instead of bouncing off submit.
const MIN_CHARS = 180;

interface FrameworkModalProps {
  framework: string;
  description: string;
  isSubmitting: boolean;
  isEditing?: boolean;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}

export function FrameworkModal({
  framework,
  description,
  isSubmitting,
  isEditing = false,
  onDescriptionChange,
  onClose,
  onSubmit,
}: FrameworkModalProps) {
  const charCount = description.length;
  const meetsMinimum = charCount >= MIN_CHARS;
  const { isRecording, transcript, toggleRecording, isSupported } =
    useSpeechRecognition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isRecording && transcript !== description) {
      onDescriptionChange({
        target: { value: transcript },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
  }, [transcript, isRecording, description, onDescriptionChange]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [description]);

  const handleVoiceClick = () => {
    if (isRecording) {
      toggleRecording();
    } else {
      toggleRecording(description);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={framework}
      size="md"
      className={cn(borderRadius.xl, "overflow-y-auto")}
      subtitle={isEditing ? "Edit your notes" : "Add implementation notes"}
      icon={<LightbulbIcon size="sm" />}
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <span
            className={cn(
              "text-xs",
              meetsMinimum ? "text-success font-medium" : "text-base-content/60"
            )}
          >
            {meetsMinimum
              ? `Minimum met (${charCount} characters)`
              : `${MIN_CHARS - charCount} more characters needed`}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" color="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              color="primary"
              onClick={onSubmit}
              disabled={isSubmitting || !meetsMinimum}
              loading={isSubmitting}
            >
              {isEditing ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      }
    >
      {/* Content */}
      <div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={onDescriptionChange}
            className={cn(
              "textarea textarea-bordered w-full resize-none overflow-y-auto",
              "focus:textarea-primary",
              transitions.normal
            )}
            style={{ minHeight: "120px" }}
            placeholder={`Describe your implementation, insights, and learnings (at least ${MIN_CHARS} characters)...`}
            autoFocus
          />

          {/* Voice Button */}
          {isSupported && (
            <Button
              onClick={handleVoiceClick}
              variant="ghost"
              color="secondary"
              className={cn(
                "absolute bottom-2 right-2",
                "flex items-center justify-center hover:border-primary w-10 h-10 hover:text-primary",
                borderRadius.rounded,
                "cursor-pointer",
                isRecording
                  ? [
                      "voice-ripple-animation",
                      bgColors.accent,
                      textColors.primary,
                    ]
                  : textColors.secondary
              )}
              title={isRecording ? "Stop recording" : "Start recording"}
              iconBefore={<MicIcon size="sm" />}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
