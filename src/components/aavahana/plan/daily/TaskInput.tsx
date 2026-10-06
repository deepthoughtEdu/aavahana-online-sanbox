// src/components/daily-plan/TaskInput.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/lib/hooks/shared/use-speech-recognition";
import { PlusIcon, MicIcon } from "@/components/shared/icons";
import { Button } from "@/components/shared/Button";
import { cn } from "@/utils";
import { sizes } from "@/utils/shared/design.utils";

interface TaskInputProps {
  onAddTask: (text: string) => void;
}

export function TaskInput({ onAddTask }: TaskInputProps) {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isRecording,
    transcript,
    toggleRecording,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  const handleAddTask = () => {
    if (inputValue.trim()) {
      onAddTask(inputValue);
      setInputValue("");
      resetTranscript();
      // Stop recording after task submission
      if (isRecording) {
        toggleRecording();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
  };

  return (
    <div>
      <div className="relative mt-1 mb-2 mx-2">
        <textarea
          ref={textareaRef}
          rows={1}
          className={cn(
            "w-full px-4 py-3 pr-14",
            "border",
            "border-accent/40",
            "placeholder:text-[var(--dt-textDim)] placeholder:text-sm",
            "resize-none overflow-hidden",
            "max-h-[200px] mt-3",
            sizes.lg.rounded,
            "transition-all duration-200"
          )}
          placeholder="What's your focus for today?"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        {/* Mic button positioned inside textarea */}
        {isSupported && (
          <Button
            color="secondary"
            size="md"
            iconBefore={<MicIcon size="sm" />}
            className={cn(
              "absolute right-3 bottom-2.5",
              "flex items-center justify-center hover:border-primary w-10 h-10 hover:text-primary",
              "transition-all duration-200",
              "rounded-full",
              isRecording
                ? [
                    "voice-ripple-animation",
                    "bg-accent/10",
                    "text-primary",
                  ]
                : "dt-text-muted"
            )}
            onClick={() => toggleRecording(inputValue)}
          />
        )}
      </div>

      <div className="flex justify-end mr-2">
        <Button
          size="md"
          onClick={handleAddTask}
          disabled={!inputValue.trim()}
          iconBefore={<PlusIcon size="sm" />}
        >
          Add Task
        </Button>
      </div>
    </div>
  );
}
