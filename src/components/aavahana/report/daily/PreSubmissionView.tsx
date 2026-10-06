// components/daily-report/PreSubmissionView.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { useSpeechRecognition } from "@/lib/hooks/shared/use-speech-recognition";
import { Button } from "@/components/shared/Button";
import { Section } from "@/components/shared/Section";
import { VoiceButton } from "@/components/shared/VoiceButton";
import { MessageCircleIcon, SendIcon } from "@/components/shared/icons";
import { cn, toast } from "@/utils";
import {
  sizes,
  borderColors,
  textColors,
  transitions,
  borderRadius,
} from "@/utils/shared/design.utils";
import { TasksSection } from "./TasksSection";
import { FrameworksSection } from "./FrameworksSection";
import { FrameworkModal } from "./FrameworkModal";
import { ChatReflectionModal } from "./ChatReflectionModal";
import { ReportPlanItem } from "@/types";
import {
  reflectionSchema,
  REFLECTION_MAX_WORDS,
} from "@/validations/aavahana/plan.validations";

import { LoggedOutSection } from "./LoggedoutSection";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { useDailyPlan } from "@/lib/hooks/aavahana/use-daily-plan";

interface PreSubmissionViewProps {
  reflection: string;
  isSubmitting: boolean;
  planTasks: ReportPlanItem[];
  activeFrameworks: string[];
  taskStatuses: Record<number, string>;
  selectedFramework: string | null;
  frameworkDesc: string;
  isSubmittingFramework: boolean;
  FRAMEWORKS: string[];
  isLoggingOut: boolean;
  hasLoggedOut: boolean;
  hasLoggedIn: boolean;
  isPlanSubmitted: boolean;
  /** True when this editor is reopened to revise an already-submitted report. */
  isEditingSubmitted?: boolean;
  onReflectionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => Promise<void>;
  onTaskStatusChange: (index: number, status: string) => void;
  onFrameworkSelect: (framework: string) => void;
  onFrameworkDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFrameworkClose: () => void;
  onFrameworkSubmit: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export function PreSubmissionView({
  reflection,
  isSubmitting,
  planTasks,
  activeFrameworks,
  taskStatuses,
  selectedFramework,
  frameworkDesc,
  isSubmittingFramework,
  FRAMEWORKS,
  isLoggingOut,
  hasLoggedOut,
  hasLoggedIn,
  isEditingSubmitted = false,
  onReflectionChange,
  onSubmit,
  onTaskStatusChange,
  onFrameworkSelect,
  onFrameworkDescChange,
  onFrameworkClose,
  onFrameworkSubmit,
  onLogout,
}: PreSubmissionViewProps) {
  const {
    isRecording,
    transcript,
    toggleRecording,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();
  const { isToday } = useDailyPlan();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editingFramework, setEditingFramework] = useState<string | null>(null);
  const [frameworkNotes, setFrameworkNotes] = useState<Record<string, string>>(
    {}
  );

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const lastSaveTime = useRef<number>(0);

  // Check if plan exists for this specific date (not just today)
  const hasPlanForDate = planTasks && planTasks.length > 0;

  // Calculate word count
  const wordCount = reflection.trim()
    ? reflection
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0;

  // Load draft ONLY ONCE on mount
  useEffect(() => {
    const saved = localStorage.getItem("daily-report-draft");
    if (saved && !reflection) {
      onReflectionChange({
        target: { value: saved },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once

  // Auto-save draft with smart clearing
  useEffect(() => {
    // If text is empty, clear the draft
    if (!reflection.trim()) {
      localStorage.removeItem("daily-report-draft");
      return;
    }

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTime.current;

    // Save every 1 min while typing
    if (timeSinceLastSave >= 60000) {
      localStorage.setItem("daily-report-draft", reflection);
      toast.success("Draft saved");
      lastSaveTime.current = now;
    }
  }, [reflection]);

  useEffect(() => {
    if (isRecording && transcript !== reflection) {
      onReflectionChange({
        target: { value: transcript },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
  }, [transcript, isRecording, reflection, onReflectionChange]);

  // Validate on change
  useEffect(() => {
    if (reflection.trim()) {
      const result = reflectionSchema.safeParse({ reflection });
      if (!result.success) {
        setValidationError(result.error!.issues[0].message || "");
      } else {
        setValidationError("");
      }
    } else {
      setValidationError("");
    }
  }, [reflection]);

  const handleVoiceClick = () => {
    if (isRecording) {
      toggleRecording();
      resetTranscript();
    } else {
      toggleRecording(reflection);
    }
  };

  const handleFrameworkSelect = (framework: string) => {
    if (activeFrameworks.includes(framework)) {
      setEditingFramework(framework);
      const savedNotes = frameworkNotes[framework] || "";
      onFrameworkDescChange({
        target: { value: savedNotes },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    } else {
      setEditingFramework(null);
      onFrameworkDescChange({
        target: { value: "" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
    onFrameworkSelect(framework);
  };

  const handleFrameworkClose = () => {
    onFrameworkClose();
    setEditingFramework(null);
  };

  const handleFrameworkSubmitInternal = async () => {
    if (selectedFramework) {
      setFrameworkNotes({
        ...frameworkNotes,
        [selectedFramework]: frameworkDesc,
      });
    }
    await onFrameworkSubmit(); // ← API call succeeds
    handleFrameworkClose(); // ← Modal closes immediately
  };
  const insertChatText = (text: string) => {
    const newReflection = reflection + (reflection ? " " : "") + text;
    onReflectionChange({
      target: { value: newReflection },
    } as React.ChangeEvent<HTMLTextAreaElement>);
  };

  const handleSubmit = async () => {
    const result = reflectionSchema.safeParse({ reflection });
    if (!result.success) {
      setValidationError(
        result.error!.issues[0].message || "Validation failed"
      );
      return;
    }

    await onSubmit();

    // Clear draft after successful submission
    localStorage.removeItem("daily-report-draft");
  };

  const handleModalOpen = async () => {
    if (!hasPlanForDate) {
      toast.error("Please submit your plan to use this feature.");
      return;
    }
    setIsChatOpen(true);
  };

  // Handle textarea change with draft clearing
  const handleReflectionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;

    // If user manually clears all text, also clear the draft immediately
    if (!newValue.trim()) {
      localStorage.removeItem("daily-report-draft");
    }

    onReflectionChange(e);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:auto-rows-fr">
      {/* Left Column - Tasks & Frameworks */}
      <div className="flex flex-col space-y-6">
        <TasksSection
          tasks={planTasks}
          statuses={taskStatuses}
          onStatusChange={onTaskStatusChange}
        />

        <FrameworksSection
          frameworks={FRAMEWORKS}
          activeFrameworks={activeFrameworks}
          onFrameworkSelect={handleFrameworkSelect}
        />
        {!hasLoggedOut && hasLoggedIn && (
          <LoggedOutSection isLoggingOut={isLoggingOut} onLogout={onLogout} />
        )}
      </div>

      {/* Right Column - Reflection */}
      <div className="flex flex-col space-y-6">
        <Section
          className={cn(
            "bg-base-100 border flex flex-col flex-1",
            borderColors.ghost,
            sizes.xl.rounded
          )}
        >
          {!hasPlanForDate ? (
            <>
              <Section.Header
                icon={<FileText size={18} />}
                title="Daily Report"
                subtitle="Submit your plan first to unlock"
                size="sm"
              />

              {/* Empty State */}
              <Section.Body
                className={cn(
                  "flex-1 flex items-center justify-center",
                  borderRadius.lg
                )}
              >
                <EmptyState
                  icon={<FileText size={18} />}
                  title="No Plan Submitted Yet"
                  subtitle="Submit your daily plan first to unlock the report section.
                    Your plan helps structure your reflection and track progress."
                >
                  {isToday && (
                    <Button color="primary" variant="soft">
                      <Link href={`/aavahana/daily-plan`}>Go to Plan Section</Link>
                    </Button>
                  )}
                </EmptyState>
              </Section.Body>
            </>
          ) : (
            <>
              <Section.Header
                icon={<FileText size={18} />}
                title="Daily Report"
                subtitle="Document your progress and learnings"
                size="sm"
              >
                <Button
                  size="sm"
                  color="primary"
                  variant="soft"
                  onClick={handleModalOpen}
                  iconBefore={<MessageCircleIcon size="sm" />}
                >
                  AI Assistant
                  <sup className="text-[8px] margin-0 padding-0">Beta</sup>
                </Button>
              </Section.Header>

              {/* Content Area */}
              <Section.Body
                className="space-y-4 flex-1 flex flex-col px-4"
                noPadding={{ x: true }}
              >
                {/* Textarea Container - grows to fill available space */}
                <div className="relative flex-1 flex flex-col">
                  <textarea
                    ref={textareaRef}
                    value={reflection}
                    onChange={handleReflectionChange}
                    className={cn(
                      "w-full lg:h-full px-4 py-3 h-[30vh]",
                      "border resize-none",
                      borderColors.accent,
                      sizes.sm.text,
                      sizes.sm.rounded,
                      transitions.normal
                    )}
                    placeholder="What did I plan? What did I accomplish? What challenges did I face? What did I learn?"
                  />

                  {/* Voice Button */}
                  <VoiceButton
                    isRecording={isRecording}
                    isSupported={isSupported}
                    onClick={handleVoiceClick}
                  />
                </div>

                {/* Word Count & Validation */}
                <div className="flex items-center justify-between flex-shrink-0">
                  <div className={cn(sizes.xs.text, textColors.secondary)}>
                    {wordCount} / {REFLECTION_MAX_WORDS} words
                  </div>
                  {validationError && (
                    <span className={cn(sizes.xs.text, "text-error")}>
                      {validationError}
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  modifier="block"
                  color="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting || !reflection.trim() || !!validationError
                  }
                  loading={isSubmitting}
                  iconBefore={!isSubmitting && <SendIcon size="sm" />}
                  className="flex-shrink-0"
                >
                  {isSubmitting
                    ? isEditingSubmitted
                      ? "Saving..."
                      : "Submitting..."
                    : isEditingSubmitted
                    ? "Save changes"
                    : "Submit Daily Report"}
                </Button>
              </Section.Body>
            </>
          )}
        </Section>
      </div>

      {/* Framework Modal */}
      {selectedFramework && (
        <FrameworkModal
          framework={selectedFramework}
          description={frameworkDesc}
          isEditing={editingFramework === selectedFramework}
          isSubmitting={isSubmittingFramework}
          onDescriptionChange={onFrameworkDescChange}
          onClose={handleFrameworkClose}
          onSubmit={handleFrameworkSubmitInternal}
        />
      )}

      {/* Chat Modal */}
      <ChatReflectionModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onInsertText={insertChatText}
      />
    </div>
  );
}
