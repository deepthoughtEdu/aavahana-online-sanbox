"use client";

import React, { useState, useEffect } from "react";
import { Section } from "@/components/shared/Section";
import { Button } from "@/components/shared/Button";
import { VoiceButton } from "@/components/shared/VoiceButton";
import { MicIcon, SendIcon } from "@/components/shared/icons";
import { TargetIcon } from "lucide-react";
import { PlanService } from "@/lib/services/aavahana/plan.service";
import { useApiMutation } from "@/lib/hooks/shared/use-api";
import { toast } from "react-hot-toast";
import { WeeklyPlanResponse, WeeklyPlanSubmitPayload } from "@/types";
import { cn } from "@/utils";
import { gaps, sizes, textColors } from "@/utils/shared/design.utils";
import { useSpeechRecognition } from "@/lib/hooks/shared/use-speech-recognition";

interface PreSubmissionViewProps {
  weekStart: string;
  onSubmitSuccess: (response: WeeklyPlanResponse) => void;
}

export function PreSubmissionView({
  weekStart,
  onSubmitSuccess,
}: PreSubmissionViewProps) {
  const [weeklyGoals, setWeeklyGoals] = useState("");
  const [planTranscript, setPlanTranscript] = useState("");

  // Speech recognition hook
  const { isRecording, transcript, toggleRecording, isSupported } =
    useSpeechRecognition();

  // Sync transcript from speech recognition
  useEffect(() => {
    if (transcript) {
      setPlanTranscript(transcript);
    }
  }, [transcript]);

  // Submit mutation
  const submitMutation = useApiMutation({
    mutationFn: PlanService.submitWeeklyPlan,
    onSuccess: (result) => {
      const weeklyPlanResponse: WeeklyPlanResponse = {
        weekStart: result.weekStart,
        transcript: planTranscript.trim(),
        weeklyGoals: weeklyGoals.trim(),
        evaluation: result.evaluation,
        submissionStatus: "ok",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSubmitSuccess(weeklyPlanResponse);
      toast.success("Weekly plan submitted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit weekly plan");
    },
  });

  const handleVoiceClick = () => {
    if (isRecording) {
      toggleRecording();
    } else {
      toggleRecording(planTranscript);
    }
  };

  const handleSubmit = async () => {
    if (!weeklyGoals.trim()) {
      toast.error("Please enter your weekly goals");
      return;
    }

    if (!planTranscript.trim()) {
      toast.error("Please provide a transcript of your weekly plan");
      return;
    }

    const payload: WeeklyPlanSubmitPayload = {
      weekStart,
      weeklyGoals: weeklyGoals.trim(),
      transcript: planTranscript.trim(),
    };

    submitMutation.mutate(payload);
  };

  const transcriptCharCount = planTranscript.length;

  return (
    <div className={cn("space-y-6")}>
      {/* Section 1: Weekly Goal */}
      <Section>
        <Section.Header
          icon={<TargetIcon />}
          title="This Week's Goal"
          size="sm"
          subtitle="In one line, what must be true by week's end?"
        />
        <Section.Body>
          <div className={cn(gaps.sm)}>
            <textarea
              className="textarea textarea-bordered w-full h-24 resize-none"
              placeholder="For this week my task is to complete the DT avahana modules of Daily plan, daily report in API and frontend."
              value={weeklyGoals}
              onChange={(e) => setWeeklyGoals(e.target.value)}
              maxLength={5000}
              disabled={submitMutation.isPending}
            />
          </div>
        </Section.Body>
      </Section>

      {/* Section 2: Voice Plan Composer */}
      <Section>
        <Section.Header
          icon={<MicIcon />}
          size="sm"
          title="Voice Plan Composer"
          subtitle="Tap the circular mic and narrate your weekly plan—objectives, KRs, and day-wise tasks."
        />
        <Section.Body>
          <div className={cn(gaps.md)}>
            {/* Live Transcript with Voice Button */}
            <div className="relative">
              <label className="label">
                <span className="label-text font-medium">Live Transcript</span>
                <span className={cn("label-text-alt", textColors.ghost)}>
                  {transcriptCharCount} / 10,000
                </span>
              </label>
              <textarea
                className={cn(
                  "textarea textarea-bordered w-full h-40 resize-none font-mono",
                  sizes.sm.text
                )}
                placeholder="Your voice narration will appear here... Or type manually if you prefer."
                value={planTranscript}
                onChange={(e) => setPlanTranscript(e.target.value)}
                maxLength={10000}
                disabled={submitMutation.isPending}
              />
              <VoiceButton
                isRecording={isRecording}
                isSupported={isSupported}
                onClick={handleVoiceClick}
                disabled={submitMutation.isPending}
              />
            </div>
          </div>
        </Section.Body>
        <Section.Footer>
          <div className="flex justify-end">
            <Button
              color="primary"
              size="md"
              onClick={handleSubmit}
              loading={submitMutation.isPending}
              disabled={!weeklyGoals.trim() || !planTranscript.trim()}
              iconBefore={<SendIcon />}
            >
              Submit Plan
            </Button>
          </div>
        </Section.Footer>
      </Section>
    </div>
  );
}
