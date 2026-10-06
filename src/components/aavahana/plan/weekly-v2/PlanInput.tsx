"use client";

import { useState } from "react";
import { Section } from "@/components/shared/Section";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { useSpeechRecognition } from "@/lib/hooks/shared/use-speech-recognition";
import {
  SparklesIcon,
  PlusIcon,
  CalendarIcon,
  ArrowLeftIcon,
  MicIcon,
} from "@/components/shared/icons";
import { cn } from "@/utils";
import type { WeeklyPlanV2Chip } from "@/types/aavahana/weekly-plan-v2.types";

interface Props {
  aiDraft: string;
  setAiDraft: (text: string) => void;
  parseWithAi: (draft?: string) => Promise<void>;
  isParsing: boolean;

  carryForwardCandidates: WeeklyPlanV2Chip[];
  monthlyBasketCandidates: WeeklyPlanV2Chip[];
  importFromCarry: (id: string) => void;
  importFromMonthly: (id: string) => void;
  hasPreviousWeek: boolean;
}

type OpenSource = "none" | "monthly" | "carry";

export function PlanInput({
  aiDraft,
  setAiDraft,
  parseWithAi,
  isParsing,
  carryForwardCandidates,
  monthlyBasketCandidates,
  importFromCarry,
  importFromMonthly,
  hasPreviousWeek,
}: Props) {
  const [openSource, setOpenSource] = useState<OpenSource>("none");
  const {
    isRecording,
    transcript,
    toggleRecording,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  function handleVoiceToggle() {
    if (isRecording) {
      // Stop recording, then merge transcript into the textarea.
      toggleRecording();
      const captured = transcript.trim();
      if (captured) {
        const next = aiDraft.trim()
          ? `${aiDraft.trim()} ${captured}`
          : captured;
        setAiDraft(next);
        resetTranscript();
      }
    } else {
      toggleRecording();
    }
  }

  const showCarryButton = hasPreviousWeek && carryForwardCandidates.length > 0;
  const showMonthlyButton = monthlyBasketCandidates.length > 0;

  return (
    <Section>
      <Section.Header
        icon={<SparklesIcon size="sm" />}
        title="Plan your week"
        subtitle="Type or tap the mic to speak — AI will break it into your week"
        size="md"
      />

      <Section.Body>
        <div className="relative">
          <textarea
            value={aiDraft}
            onChange={(e) => setAiDraft(e.target.value)}
            placeholder="Tell me about your week — wrap up SF2 audit, onboard Geeta, document the stores escalation runbook…"
            className="textarea textarea-bordered w-full text-sm pr-12"
            rows={3}
            disabled={isParsing}
          />
          {isSupported && (
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={isParsing}
              aria-label={isRecording ? "Stop recording" : "Voice input"}
              title={isRecording ? "Stop recording" : "Voice input"}
              className={cn(
                "btn btn-circle btn-sm absolute bottom-2 right-2",
                isRecording
                  ? "btn-error voice-ripple-animation"
                  : "btn-ghost"
              )}
            >
              <MicIcon size="sm" />
            </button>
          )}
        </div>

        {isRecording && (
          <p className="text-xs text-error mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-error animate-pulse" />
            Listening{transcript ? `: "${transcript}"` : "…"}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Button
            color="primary"
            size="sm"
            loading={isParsing}
            disabled={!aiDraft.trim() || isParsing}
            onClick={() => parseWithAi()}
            iconBefore={!isParsing ? <SparklesIcon size="sm" /> : undefined}
          >
            {isParsing ? "Building…" : "Build my plan"}
          </Button>

          <span className="text-xs text-neutral mx-1">or pull in:</span>

          {showMonthlyButton && (
            <Button
              color="primary"
              variant="soft"
              size="sm"
              onClick={() =>
                setOpenSource(openSource === "monthly" ? "none" : "monthly")
              }
              iconBefore={<CalendarIcon size="sm" />}
              active={openSource === "monthly"}
            >
              Monthly
              <Badge
                label={String(monthlyBasketCandidates.length)}
                variant="primary"
                size="sm"
                icon={null}
                className="ml-1.5"
              />
            </Button>
          )}

          {showCarryButton && (
            <Button
              color="warning"
              variant="soft"
              size="sm"
              onClick={() =>
                setOpenSource(openSource === "carry" ? "none" : "carry")
              }
              iconBefore={<ArrowLeftIcon size="sm" />}
              active={openSource === "carry"}
            >
              Last week
              <Badge
                label={String(carryForwardCandidates.length)}
                variant="warning"
                size="sm"
                icon={null}
                className="ml-1.5"
              />
            </Button>
          )}
        </div>

        {openSource === "monthly" && showMonthlyButton && (
          <SourceList
            items={monthlyBasketCandidates}
            onPick={importFromMonthly}
            label="From the monthly plan"
            toneClass="border-primary/20 bg-primary/5"
          />
        )}

        {openSource === "carry" && showCarryButton && (
          <SourceList
            items={carryForwardCandidates}
            onPick={importFromCarry}
            label="Carried from last week"
            toneClass="border-warning/30 bg-warning/5"
          />
        )}
      </Section.Body>
    </Section>
  );
}

function SourceList({
  items,
  onPick,
  label,
  toneClass,
}: {
  items: WeeklyPlanV2Chip[];
  onPick: (id: string) => void;
  label: string;
  toneClass: string;
}) {
  return (
    <div className={cn("mt-3 rounded-lg border p-3", toneClass)}>
      <p className="text-xs font-bold uppercase tracking-wider text-neutral mb-2">
        {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <div className="flex-1 min-w-0">
              <p className="text-black truncate">{item.title}</p>
              {(item.programName || item.estimateMins != null) && (
                <p className="text-xs text-neutral truncate">
                  {item.programName}
                  {item.programName && item.estimateMins != null && " · "}
                  {item.estimateMins != null && `~${item.estimateMins}m`}
                </p>
              )}
            </div>
            <Button
              color="primary"
              variant="ghost"
              size="xs"
              onClick={() => onPick(item.id)}
              iconBefore={<PlusIcon size="xs" />}
            >
              Add
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
