"use client";

import React, { useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/lib/hooks/shared/use-speech-recognition";
import { MicIcon } from "@/components/shared/icons";
import { cn } from "@/utils";

import {
  clampWords,
  countWords,
  looksLikeGibberish,
  MAX_ANSWER_WORDS,
} from "@/utils/aavahana/text-quality.utils";
import { countExplanationChars } from "@/utils/aavahana/report-explanation";

// Re-exported because every caller of this field already imports countWords
// from here, and the two belong together.
export { countWords, looksLikeGibberish, MAX_ANSWER_WORDS };

interface MicTextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  /** Soft target; drives the "N more words" nudge (not a hard block here). */
  minWords?: number;
  /**
   * Soft target in characters, counted the way the report's explanation
   * minimum counts them; drives the "N more characters" nudge.
   */
  minChars?: number;
  /**
   * Hard ceiling. Typing and dictation both stop here rather than the text
   * being silently cut on submit, so nobody loses a sentence they watched
   * themselves write.
   */
  maxWords?: number;
  /** Gentle, non-blocking prompts to help the user add context. */
  hints?: string[];
  autoFocus?: boolean;
  className?: string;
  /** For a <label htmlFor>. */
  id?: string;
  /**
   * Also stops a recording in progress, so dictation cannot keep writing into
   * a field that is waiting on a reply.
   */
  disabled?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
}

/**
 * A textarea you can either type or speak into. The mic streams live speech
 * straight into the field (seeded from whatever's already there). A quiet word
 * counter nudges toward a minimum, and optional hint chips suggest what to add
 * — all without blocking or interrupting the flow.
 */
export function MicTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  minWords = 0,
  minChars = 0,
  maxWords = MAX_ANSWER_WORDS,
  hints = [],
  autoFocus,
  className,
  id,
  disabled,
  onKeyDown,
}: MicTextareaProps) {
  const { isRecording, transcript, startRecording, stopRecording, isSupported } =
    useSpeechRecognition();

  // One gate for typing and dictation both. Speech is the path that actually
  // runs away: somebody talking for two minutes produces far more than anybody
  // types, and without this the field would keep swallowing it and the report
  // would quietly become a transcript.
  const commit = (next: string) => onChange(clampWords(next, maxWords));

  // Mirror the live transcript into the field while recording, without making
  // onChange a hook dependency (it changes identity every render).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const maxRef = useRef(maxWords);
  maxRef.current = maxWords;
  useEffect(() => {
    if (isRecording) onChangeRef.current(clampWords(transcript, maxRef.current));
  }, [transcript, isRecording]);

  // A field waiting on a reply takes no more dictation.
  useEffect(() => {
    if (disabled && isRecording) stopRecording();
  }, [disabled, isRecording, stopRecording]);

  const words = countWords(value);
  const need = Math.max(0, minWords - words);
  const needChars = Math.max(0, minChars - countExplanationChars(value));
  const atCap = words >= maxWords;
  // Only once they are close enough for it to matter. Showing a ceiling to
  // somebody twelve words in reads as a warning about writing too much, which
  // is the opposite of what this field is asking for.
  const nearCap = words >= maxWords * 0.8;
  const junk = words >= Math.max(minWords, 3) && looksLikeGibberish(value);

  const toggle = () => {
    if (isRecording) stopRecording();
    else startRecording(value ? value.trim() + " " : "");
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => commit(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          autoFocus={autoFocus}
          id={id}
          disabled={disabled}
          onKeyDown={onKeyDown}
          className="textarea textarea-bordered w-full resize-none bg-base-100/70 pr-12 text-sm leading-relaxed"
        />
        {isSupported && (
          <button
            type="button"
            onClick={toggle}
            disabled={disabled}
            aria-label={isRecording ? "Stop recording" : "Speak instead of typing"}
            title={isRecording ? "Stop recording" : "Speak instead of typing"}
            className={cn(
              "absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              isRecording
                ? "voice-ripple-animation bg-error text-error-content"
                : "bg-base-200 text-base-content/60 hover:bg-primary hover:text-primary-content",
            )}
          >
            <MicIcon size="sm" />
          </button>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 px-1">
        {/* Gentle context prompts — suggestions, never requirements. */}
        {hints.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {hints.map((h) => (
              <span
                key={h}
                className="rounded-full bg-base-200/70 px-2 py-0.5 text-[11px] text-base-content/50"
              >
                {h}
              </span>
            ))}
          </div>
        ) : (
          <span />
        )}
        <span
          className={cn(
            "shrink-0 pt-0.5 text-[11px] tabular-nums",
            junk || atCap
              ? "text-warning"
              : isRecording
                ? "text-error"
                : need > 0 || needChars > 0
                  ? "text-base-content/40"
                  : "text-success",
          )}
        >
          {/* Order matters. At the cap, say so, because they are watching words
              stop appearing and need to know why. Then the junk warning, which
              is the only message here that is about content rather than
              length. */}
          {atCap
            ? `${maxWords} words, that's the limit`
            : junk
              ? "that doesn't look like words"
              : isRecording
                ? "listening…"
                : need > 0
                  ? `${need} more word${need === 1 ? "" : "s"}`
                  : needChars > 0
                    ? `${needChars} more character${needChars === 1 ? "" : "s"}`
                    : nearCap
                      ? `${words} of ${maxWords} words`
                      : minWords > 0 || minChars > 0
                        ? "✓ nice and full"
                        : `${words} word${words === 1 ? "" : "s"}`}
        </span>
      </div>
    </div>
  );
}
