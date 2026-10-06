"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface VoiceExplanationProps {
  activityName: string;
  onSubmit: (explanation: string) => void;
  onSkip: () => void;
}

function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: typeof SpeechRecognition })
      .SpeechRecognition ??
    (
      window as unknown as {
        webkitSpeechRecognition?: typeof SpeechRecognition;
      }
    ).webkitSpeechRecognition ??
    null
  );
}

// Browser speech recognition fails silently in a lot of real conditions
// (permission blocked, no internet, no mic, unsupported browser). Turn the raw
// error code into a plain message so the user knows to allow access or just type.
function speechErrorMessage(code: string | undefined): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked. Allow mic permission in your browser, or just type below.";
    case "no-speech":
      return "Didn't catch any speech — tap the mic to try again, or type below.";
    case "audio-capture":
      return "No microphone found. Please type your answer below.";
    case "network":
      return "Voice typing needs an internet connection and isn't available right now — please type below.";
    case "aborted":
      return "";
    default:
      return "Voice input didn't work this time. Please type your answer below.";
  }
}

export default function VoiceExplanation({
  activityName,
  onSubmit,
  onSkip,
}: VoiceExplanationProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoiceSupport] = useState(() => !!getSpeechRecognition());
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRec = getSpeechRecognition();
    if (!SpeechRec) return;

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    let finalTranscript = text;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
        } else {
          interim += transcript;
        }
      }
      setText(finalTranscript + (interim ? " " + interim : ""));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsRecording(false);
      const message = speechErrorMessage(event.error);
      if (message) setError(message);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setText(finalTranscript);
    };

    recognitionRef.current = recognition;
    setError(null);
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      setError("Couldn't start voice input. Please type your answer below.");
    }
  }, [text]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed) {
      onSubmit(trimmed);
    } else {
      onSkip();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4"
    >
      <div className="text-center mb-6">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 font-mono mb-2">
          {activityName}
        </div>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-2">
          Explain Your Choices
        </h2>
        <p className="text-sm text-slate-400 font-medium leading-relaxed">
          Why did you pick what you picked? Speak or type your reasoning.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6 space-y-4">
        {hasVoiceSupport && (
          <div className="flex justify-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30"
                  : "bg-slate-800 hover:bg-slate-700 border-2 border-slate-600"
              }`}
            >
              {isRecording ? (
                <>
                  <div className="w-5 h-5 rounded-sm bg-white" />
                  <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-30" />
                </>
              ) : (
                <svg
                  className="w-6 h-6 text-slate-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>
          </div>
        )}

        {isRecording && (
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-widest text-red-400 font-mono animate-pulse">
              Recording...
            </span>
          </div>
        )}

        {error && !isRecording && (
          <div className="text-center">
            <span className="text-xs font-medium text-amber-400/90 leading-relaxed">
              {error}
            </span>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={
            hasVoiceSupport
              ? "Tap the mic to speak, or type here..."
              : "Type your explanation here..."
          }
          rows={4}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />

        {text.trim() && (
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono">
              {text.trim().split(/\s+/).length} words
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onSkip}
          className="px-6 py-3 border border-slate-600 text-slate-300 font-black uppercase tracking-widest text-sm rounded-lg hover:border-slate-400 hover:text-white transition-all"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className={`px-8 py-3 font-black uppercase tracking-widest text-sm rounded-lg transition-all ${
            text.trim()
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
              : "bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
        >
          Continue &rarr;
        </button>
      </div>
    </motion.div>
  );
}
