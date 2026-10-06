"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Square } from "lucide-react";

interface VoiceRecorderProps {
  prompt: string;
  constraintLabel?: string;
  navigationLabel?: string;
  transcript: string;
  onTranscriptChange: (text: string) => void;
  onDone: () => void;
}

type ResultList = { isFinal: boolean; [j: number]: { transcript: string } }[];

export function VoiceRecorder({
  prompt,
  constraintLabel,
  navigationLabel,
  transcript,
  onTranscriptChange,
  onDone,
}: VoiceRecorderProps) {
  // Act2 narrative passes constraint + navigation so we can use the
  // "You faced X and used Y" template. Other callers (e.g. framework
  // narrative nodes) pass neither — show the prompt verbatim instead.
  const hasContext = Boolean(constraintLabel || navigationLabel);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionCtor: (new () => any) | undefined =
    typeof window !== "undefined"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
      : undefined;

  const micAvailable = Boolean(SpeechRecognitionCtor);

  function startRecording() {
    if (!SpeechRecognitionCtor) return;
    setErrorMsg(null);
    const previousText = transcript.trim();
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: { results: ResultList }) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      const newText = (final || interim).trim();
      const combined = previousText ? `${previousText} ${newText}` : newText;
      onTranscriptChange(combined);
    };
    recognition.onerror = (event: { error?: string }) => {
      const code = event?.error ?? "unknown";
      // Map browser error codes to user-readable messages — and log the raw
      // code so we can debug from the console.
       
      console.warn("[VoiceRecorder] speech recognition error:", code);
      const map: Record<string, string> = {
        "not-allowed": "Microphone access was blocked. Allow it in the browser's site settings and reload.",
        "service-not-allowed": "Microphone access was blocked. Allow it in the browser's site settings and reload.",
        "no-speech": "Didn't hear anything — try speaking closer to the mic.",
        "audio-capture": "No microphone detected. Plug one in or check OS sound settings.",
        "network": "Speech recognition needs an internet connection.",
        "aborted": "Recording stopped.",
      };
      setErrorMsg(map[code] ?? `Speech recognition failed (${code}). Try typing instead.`);
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      // Calling .start() twice in quick succession throws InvalidStateError.
      const msg = err instanceof Error ? err.message : String(err);
       
      console.warn("[VoiceRecorder] start threw:", msg);
      setErrorMsg(`Couldn't start the recorder (${msg}). Try typing instead.`);
    }
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const canProceed = transcript.trim().length >= 10;

  return (
    <div className="flex flex-col gap-5">
      {/* Prompt with highlighted dynamic parts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {hasContext ? (
          <p className="text-base leading-relaxed text-base-content/70">
            You faced{" "}
            <span className="font-bold text-primary">{constraintLabel || "…"}</span>
            {" "}and used{" "}
            <span className="font-bold text-primary">{navigationLabel || "…"}</span>
            {" "}— tell us the story
          </p>
        ) : (
          <p className="text-base leading-relaxed text-base-content/70">{prompt}</p>
        )}
      </motion.div>

      {/* Mic button — dramatic entrance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.1, 0.64, 1] }}
        className="flex flex-col items-center gap-3"
      >
        {micAvailable ? (
          <motion.button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            animate={isRecording ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={isRecording ? { repeat: Infinity, duration: 1.2 } : { duration: 0.1 }}
            className={
              isRecording
                ? "voice-ripple-animation flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-content shadow-xl shadow-primary/30"
                : "flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary shadow-md transition-all active:scale-90 active:bg-primary/20"
            }
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <Square size={28} /> : <Mic size={28} />}
          </motion.button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-base-300 bg-base-200 text-base-content/40">
              <MicOff size={28} />
            </div>
            <p className="text-sm text-base-content/50">Mic not available — type below</p>
          </div>
        )}

        <AnimatePresence>
          {isRecording && (
            <motion.button
              type="button"
              onClick={stopRecording}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="btn btn-sm btn-error btn-outline active:scale-95"
            >
              Done speaking
            </motion.button>
          )}
        </AnimatePresence>

        {errorMsg && (
          <p className="max-w-sm text-center text-xs text-error">{errorMsg}</p>
        )}
      </motion.div>

      {/* Transcript */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
      >
        <textarea
          rows={4}
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder="Your story here…"
          aria-label="Your narrative"
          className="textarea textarea-bordered w-full resize-none text-sm transition-all duration-200 focus:border-primary focus:shadow-md focus:shadow-primary/10"
        />
      </motion.div>

      <motion.button
        type="button"
        disabled={!canProceed}
        onClick={onDone}
        whileTap={{ scale: 0.94 }}
        className="btn btn-primary w-full disabled:opacity-25"
      >
        Next →
      </motion.button>
    </div>
  );
}
