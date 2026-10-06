"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { MicIcon, StopIcon } from "@/components/shared/icons";
import { useSpeechRecognition } from "@/lib/hooks/shared/use-speech-recognition";

interface ReflectionStepProps {
  blockName: string;
  minChars: number;
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onComplete: (text: string) => void;
}

// The closing step of an HCD assessment: the results open once this is saved.
// What people write here feeds the tacit-knowledge dataset.
export function ReflectionStep({
  blockName,
  minChars,
  saving,
  error,
  onBack,
  onComplete,
}: ReflectionStepProps) {
  const [text, setText] = useState("");
  const { transcript, isRecording, isSupported, startRecording, stopRecording } =
    useSpeechRecognition();
  const count = text.trim().length;
  const met = count >= minChars;

  useEffect(() => {
    if (isRecording) setText(transcript);
  }, [transcript, isRecording]);

  const goBack = () => {
    if (isRecording) stopRecording();
    onBack();
  };

  const complete = () => {
    if (isRecording) return;
    onComplete(text.trim());
  };

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 border border-base-300 p-5">
        <p className="text-xs font-medium dt-text-dim uppercase tracking-wide">
          Reflection
        </p>
        <h4 className="font-semibold mt-1">
          How will you use this framework in your current work?
        </h4>
        <p className="text-sm dt-text-dim mt-1">
          {blockName}. Name where this applies in your real work — the situation,
          what you will do differently, and how you will know it worked.
        </p>

        <div className="relative mt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            disabled={saving || isRecording}
            className="textarea textarea-bordered block w-full resize-y pb-16 pr-16 text-sm leading-relaxed"
            placeholder="Write from your own work, not the reading."
          />
          {isSupported && (
            <div className="absolute bottom-3 right-3">
              <Button
                shape="circle"
                color={isRecording ? "error" : "primary"}
                className="h-11 min-h-11 w-11 rounded-full!"
                disabled={saving}
                title={isRecording ? "Stop dictation" : "Speak instead of typing"}
                aria-label={isRecording ? "Stop dictation" : "Speak instead of typing"}
                aria-pressed={isRecording}
                onClick={() =>
                  isRecording ? stopRecording() : startRecording(text)
                }
                iconBefore={
                  isRecording ? <StopIcon size="sm" /> : <MicIcon size="sm" />
                }
              />
            </div>
          )}
        </div>

        {isRecording && (
          <p role="status" className="mt-2 text-xs dt-text-dim">
            Listening. Stop dictation to review and edit your reflection.
          </p>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${met ? "text-success" : "dt-text-dim"}`}>
            {count} / {minChars}
          </span>
          {!met && (
            <span className="text-xs text-error">
              {minChars - count} more characters needed
            </span>
          )}
        </div>

        {error && <p className="text-xs text-error mt-2">{error}</p>}
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={goBack} disabled={saving} className="btn btn-ghost btn-sm">
          &larr; Back to questions
        </button>
        <button
          type="button"
          onClick={complete}
          disabled={!met || saving || isRecording}
          className="btn btn-primary btn-sm"
        >
          {saving ? "Saving…" : "Finish assessment"}
        </button>
      </div>
    </div>
  );
}
