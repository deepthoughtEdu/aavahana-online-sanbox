// src/lib/hooks/use-speech-recognition.ts

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "@/utils";

// Constants
const NO_SPEECH_TIMEOUT_MS = 5000; // 5 seconds

// Type definitions for Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef("");
  const finalTextRef = useRef("");
  const isStoppingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const noSpeechTimeoutRef = useRef<number | null>(null);
  const sessionIdRef = useRef(0);
  const currentSessionRef = useRef(0);

  const SpeechRecognitionClass =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  // Helper function to handle recording stop with cleanup
  const handleRecordingStop = useCallback((showToast = false) => {
    isStoppingRef.current = true;
    isRecordingRef.current = false;
    setIsRecording(false);

    // Clear the no-speech timeout
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
      noSpeechTimeoutRef.current = null;
    }

    try {
      recognitionRef.current?.stop();
    } catch {
      // Silently handle expected stop errors
    }

    if (showToast) {
      toast("Recording stopped: No speech detected", { icon: "ℹ️" });
    }
  }, []);

  // Helper function to set timeout for auto-stop on no speech
  const setNoSpeechTimeout = useCallback(() => {
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
    }
    
    noSpeechTimeoutRef.current = window.setTimeout(() => {
      if (isRecordingRef.current) {
        handleRecordingStop(true);
      }
    }, NO_SPEECH_TIMEOUT_MS);
  }, [handleRecordingStop]);

  //  Initialize recognition once, not on every isRecording change
  useEffect(() => {
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Only process results from the current session
      const sessionAtStart = currentSessionRef.current;
      
      let interimTranscript = "";

      // Reset the no-speech timeout when speech is detected
      setNoSpeechTimeout();

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const chunk = result[0]?.transcript || "";

        if (result.isFinal) {
          // Only accumulate if we're still in the same session
          if (sessionAtStart === currentSessionRef.current) {
            finalTextRef.current += (finalTextRef.current ? " " : "") + chunk;
          }
        } else {
          interimTranscript += chunk + " ";
        }
      }

      // Only update transcript if we're still in the same session
      if (sessionAtStart === currentSessionRef.current) {
        const fullText = [
          baseTextRef.current,
          finalTextRef.current.trim(),
          interimTranscript.trim(),
        ]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        setTranscript(fullText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // `aborted` is expected when we stop intentionally — ignore it.
      if (event.error === "aborted") {
        return;
      }

      // Fatal errors recur instantly on every restart. Auto-restarting on these
      // produces an infinite error loop even when the mic is granted (e.g. no
      // network for Chrome's cloud recognizer, or an unsupported language). Tear
      // the session down so `onend` does not restart, and surface ONE toast.
      const FATAL_ERROR_MESSAGES: Record<string, string> = {
        "not-allowed":
          "Microphone access is blocked. Allow it in your browser's site settings, then try again.",
        "service-not-allowed":
          "Speech service is blocked by the browser or OS. Check microphone permissions.",
        "audio-capture":
          "No microphone was found. Plug in/enable a mic and try again.",
        network:
          "Speech recognition needs an internet connection (it runs on Google's servers in Chrome). Check your network and try again.",
        "language-not-supported": `Your browser language (${recognition.lang}) isn't supported for speech. Try switching to English.`,
        "bad-grammar": "Speech recognition grammar error.",
      };

      const fatalMessage = FATAL_ERROR_MESSAGES[event.error];
      if (fatalMessage) {
        // Log the raw code for debugging; show the friendly message to the user.
        console.error(`[speech-recognition] fatal error: ${event.error}`);
        handleRecordingStop(false);
        toast.error(fatalMessage);
        return;
      }

      // `no-speech` is benign — the no-speech timeout handles auto-stop, and the
      // continuous recognizer recovers on the next `onend` restart.
      if (event.error !== "no-speech") {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Only auto-restart if we're still recording and didn't intentionally stop
      if (isStoppingRef.current === false && isRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          // Silently handle restart errors
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      // Set stopping flag to prevent restart attempts during cleanup
      isStoppingRef.current = true;
      isRecordingRef.current = false;
      
      // Clear the no-speech timeout on cleanup
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }
      
      recognitionRef.current?.stop();
    };
  }, [SpeechRecognitionClass, setNoSpeechTimeout, handleRecordingStop]);

  const startRecording = useCallback(
    (initialText: string = "") => {
      if (!SpeechRecognitionClass) {
        toast.error("Speech recognition not supported in this browser");
        return;
      }

      // Increment session ID to invalidate any pending results from previous session
      sessionIdRef.current += 1;
      currentSessionRef.current = sessionIdRef.current;

      // Set the initial text as the base, clearing any previous voice input
      baseTextRef.current = initialText;
      finalTextRef.current = "";
      setTranscript(initialText);
      isStoppingRef.current = false;
      isRecordingRef.current = true;
      setIsRecording(true);

      // Set initial timeout for no speech detection
      setNoSpeechTimeout();

      try {
        recognitionRef.current?.start();
      } catch {
        // Silently handle start errors
      }
    },
    [SpeechRecognitionClass, setNoSpeechTimeout]
  );

  const stopRecording = useCallback(() => {
    handleRecordingStop(false);
  }, [handleRecordingStop]);

  const toggleRecording = useCallback(
    (initialText: string = "") => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording(initialText);
      }
    },
    [isRecording, startRecording, stopRecording]
  );

  const resetTranscript = useCallback(() => {
    setTranscript("");
    baseTextRef.current = "";
    finalTextRef.current = "";
  }, []);

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    toggleRecording,
    resetTranscript,
    isSupported: !!SpeechRecognitionClass,
  };
}