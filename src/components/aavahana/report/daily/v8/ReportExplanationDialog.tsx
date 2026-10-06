"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/shared/Button";
import { MicIcon, StopIcon } from "@/components/shared/icons";
import { useSpeechRecognition } from "@/lib/hooks/shared/use-speech-recognition";
import { MIN_REPORT_EXPLANATION_CHARS, explanationLength } from "@/utils/aavahana/report-explanation";

interface Props {
  value: string;
  onChange: (value: string) => void;
  earlierNote: string;
  frameworkLabel?: string;
  pending: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}

/** Report content, not the private compassion conversation. Mounted only while open. */
export function ReportExplanationDialog({
  value, onChange, earlierNote, frameworkLabel, pending, error, onSubmit, onBack,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const { transcript, isRecording, isSupported, startRecording, stopRecording } = useSpeechRecognition();
  const change = useRef(onChange);
  change.current = onChange;
  const length = explanationLength({ narrative: value, smoothDayNote: earlierNote, frameworkMacroId: frameworkLabel });
  const remaining = Math.max(0, MIN_REPORT_EXPLANATION_CHARS - length);

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    heading.current?.focus();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    if (isRecording) change.current(transcript);
  }, [transcript, isRecording]);

  return createPortal(
    <dialog ref={dialog} className="modal" aria-labelledby={`${id}-title`}
      onCancel={(event) => { event.preventDefault(); if (!pending) onBack(); }}>
      <div className="modal-box flex max-h-[90dvh] w-11/12 max-w-xl flex-col gap-5 bg-base-100 p-5 text-base-content sm:p-6">
        <h2 ref={heading} tabIndex={-1} id={`${id}-title`} className="text-xl font-semibold outline-none">Tell us how your day went</h2>
        <div className="min-h-0 space-y-4 overflow-y-auto">
          <p id={`${id}-hint`} className="text-base leading-relaxed">
            Start with what you worked on and how it went.
            {frameworkLabel && ` You selected ${frameworkLabel}. Explain how you applied it and what happened.`}
            {" You can also include what you would like to thank yourself for today."}
          </p>
          {earlierNote.trim() && (
            <details>
              <summary className="cursor-pointer text-sm">Earlier day note {frameworkLabel ? "(for reference)" : "(included in your character count)"}</summary>
              <p className="mt-2 whitespace-pre-wrap break-words text-base">{earlierNote}</p>
            </details>
          )}
          <label htmlFor={`${id}-text`} className="sr-only">Your day in your words</label>
          <div className="relative">
            <textarea id={`${id}-text`} value={value}
            onChange={(event) => onChange(event.target.value)} rows={4}
            disabled={pending || isRecording}
            aria-describedby={`${id}-hint ${id}-count`}
            className="textarea textarea-bordered block w-full resize-y bg-base-100 pb-16 pr-16 text-base leading-relaxed"
            placeholder="Today I worked on…" />
            {isSupported && (
              <div className="absolute bottom-3 right-3">
                <Button shape="circle" color={isRecording ? "error" : "primary"}
                  className="h-11 w-11 min-h-11 rounded-full!" disabled={pending}
                  title={isRecording ? "Stop dictation" : "Speak instead of typing"}
                  aria-label={isRecording ? "Stop dictation" : "Speak instead of typing"}
                  aria-pressed={isRecording}
                  onClick={() => isRecording ? stopRecording() : startRecording(value)}
                  iconBefore={isRecording ? <StopIcon size="sm" /> : <MicIcon size="sm" />} />
              </div>
            )}
          </div>
          {!isSupported && <p className="text-sm">Speech input is unavailable in this browser. You can type instead.</p>}
          <div>
            <p id={`${id}-count`} role="status" className="text-sm tabular-nums">
              {length} characters · {remaining ? `Minimum ${MIN_REPORT_EXPLANATION_CHARS} to submit` : "Minimum reached"}
            </p>
          </div>
          {isRecording && <p role="status" className="text-sm">Listening. Stop dictation to review and edit your words before submitting.</p>}
          {error && <p role="alert" className="text-error">{error} Your words are still here. You can retry.</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button color="neutral" variant="ghost" disabled={pending} onClick={onBack}>Back to report</Button>
          <Button color="primary" disabled={pending || isRecording || remaining > 0} onClick={onSubmit}>
            {pending ? "Submitting report…" : "Submit my report"}
          </Button>
        </div>
      </div>
    </dialog>, document.body,
  );
}
