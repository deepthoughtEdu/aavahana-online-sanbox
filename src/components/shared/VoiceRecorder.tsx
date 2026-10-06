"use client";

import { useSpeechRecognition } from "@/lib/hooks/shared/use-speech-recognition";
import { MicIcon } from "@/components/shared/icons";
import { cn } from "@/utils";
import { bgColors, textColors } from "@/utils/shared/design.utils";

interface VoiceRecorderProps {
  /** Called with the final transcript when recording stops */
  onTranscriptChange?: (transcript: string) => void;
  /** Called when user clicks the primary action button (e.g. "Extract") */
  onAction?: (transcript: string) => void;
  actionLabel?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showTranscript?: boolean;
}

/**
 * Unified voice recorder component — wraps useSpeechRecognition.
 * Used in Daily Report, Weekly Plan, Monthly Report.
 * Shows a mic button, live transcript area, and an optional action button.
 */
export function VoiceRecorder({
  onTranscriptChange,
  onAction,
  actionLabel = "Extract",
  placeholder = "Press the mic and speak…",
  className,
  disabled = false,
  showTranscript = true,
}: VoiceRecorderProps) {
  const {
    isRecording,
    transcript,
    toggleRecording,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  function handleToggle() {
    if (isRecording) {
      toggleRecording();
      onTranscriptChange?.(transcript);
    } else {
      toggleRecording();
    }
  }

  function handleAction() {
    onAction?.(transcript);
  }

  function handleClear() {
    resetTranscript();
    onTranscriptChange?.("");
  }

  if (!isSupported) {
    return (
      <p className="text-sm text-error opacity-70">
        Speech recognition not supported in this browser.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showTranscript && (
        <div className="relative min-h-[100px] bg-base-200 rounded-xl p-4">
          <p
            className={cn(
              "text-sm leading-relaxed",
              !transcript && "opacity-40"
            )}
          >
            {transcript || placeholder}
          </p>

          <button
            onClick={handleToggle}
            disabled={disabled}
            className={cn(
              "absolute bottom-3 right-3",
              "flex items-center justify-center w-10 h-10",
              "rounded-full cursor-pointer border-none",
              isRecording
                ? [
                    "voice-ripple-animation",
                    bgColors.accent,
                    textColors.primary,
                  ]
                : "bg-base-300 hover:bg-primary hover:text-primary-content",
              "transition-colors"
            )}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <MicIcon size="sm" />
          </button>
        </div>
      )}

      {!showTranscript && (
        <button
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 btn btn-outline",
            isRecording && "btn-error voice-ripple-animation"
          )}
        >
          <MicIcon size="sm" />
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      )}

      <div className="flex items-center gap-2">
        {onAction && (
          <button
            onClick={handleAction}
            disabled={disabled || !transcript.trim()}
            className="btn btn-primary btn-sm flex-1"
          >
            {actionLabel}
          </button>
        )}
        {transcript && (
          <button
            onClick={handleClear}
            disabled={disabled}
            className="btn btn-ghost btn-sm"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
