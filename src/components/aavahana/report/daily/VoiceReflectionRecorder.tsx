"use client";

import { VoiceRecorder } from "@/components/shared/VoiceRecorder";
import { cn } from "@/utils";

interface VoiceReflectionRecorderProps {
  onExtract: (transcript: string) => void;
  isExtracting: boolean;
  className?: string;
}

/**
 * Single voice prompt → "Extract" button → LLM structures the reflection.
 * Module 2 (Daily Report) — REBUILD per PDGMS v4.0 A73-A74.
 * Primary input method; manual type/edit is the fallback after extraction.
 */
export function VoiceReflectionRecorder({
  onExtract,
  isExtracting,
  className,
}: VoiceReflectionRecorderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-medium">Reflect on your day</p>
        <p className="text-xs opacity-50 mt-0.5">
          Speak freely — what you planned, what you did, what blocked you, and
          what you learned. The AI will structure it into sections.
        </p>
      </div>

      {isExtracting ? (
        <div className="flex items-center gap-3 bg-base-200 rounded-xl p-4">
          <span className="loading loading-spinner loading-sm text-primary" />
          <p className="text-sm opacity-70">Extracting sections from your voice…</p>
        </div>
      ) : (
        <VoiceRecorder
          onAction={onExtract}
          actionLabel="Extract Sections"
          placeholder="Press the mic and speak about your day…"
          showTranscript
        />
      )}
    </div>
  );
}
