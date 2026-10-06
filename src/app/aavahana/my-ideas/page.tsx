"use client";

import React, { useMemo, useRef, useState } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { MicIcon } from "@/components/shared/icons";
import {
  DataTable,
  type DataTableColumn,
  type DataTableRef,
} from "@/components/shared/ui/DataTable";
import {
  HcdInitiativeService,
  type Initiative,
} from "@/lib/services/hcd/initiative.service";
import { useCreateInitiative } from "@/lib/hooks/hcd/use-initiatives";
import { useSpeechRecognition } from "@/lib/hooks/shared/use-speech-recognition";
import { toast } from "@/utils";
import { formatDate } from "@/utils/shared/date.utils";

/**
 * My Ideas (F3 Week 3 Jul 2026) — the submitter's side of the ideas workflow.
 * Capture an idea (the target of every constraint-insight nudge) and track it
 * through submitted → under review → pursue / don't pursue → implemented.
 *
 * There is ONE idea store. This writes an Improvement Object
 * (/v3/pdgms/hcd/initiatives), the same table the comm window, daily reports and
 * HCD assessments write to — and the only one the portfolio, PMS, health score
 * and dependency curve read. It used to write garudavega_ideas, which nothing
 * downstream counted, so an idea filed here could never reach a portfolio.
 */

// Improvement Object stage → the plain-language status this screen speaks.
// Verification-in-flight is what "under review" actually means: a person has
// been asked to confirm the impact and has not answered yet.
type IdeaWorkflowStatus =
  | "submitted"
  | "under_review"
  | "pursue"
  | "dont_pursue"
  | "implemented";

function workflowStatusOf(io: Initiative): IdeaWorkflowStatus {
  if (io.status === "scaled") return "implemented";
  if (io.status === "dropped") return "dont_pursue";
  if (io.verificationStatus === "submitted") return "under_review";
  if (io.status === "prototyped" || io.status === "piloted") return "pursue";
  return "submitted";
}

const STATUS_LABEL: Record<IdeaWorkflowStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  pursue: "Pursue",
  dont_pursue: "Not pursued",
  implemented: "Implemented",
};

const STATUS_VARIANT: Record<
  IdeaWorkflowStatus,
  "neutral" | "warning" | "success" | "error" | "info"
> = {
  submitted: "neutral",
  under_review: "warning",
  pursue: "info",
  dont_pursue: "error",
  implemented: "success",
};

// Category is a one-glance dropdown, defaulted so the user never HAS to think
// about it. Less input = more ideas: the only thing you must type is the idea.
// Values are free strings; labels stay human, loosely tracking the constraint
// taxonomy the idea would attack.
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "general", label: "General" },
  { value: "process", label: "Process / workflow" },
  { value: "productivity", label: "Productivity / focus" },
  { value: "communication", label: "Communication" },
  { value: "learning", label: "Learning / skills" },
  { value: "dependency", label: "Dependencies / blockers" },
  { value: "delivery", label: "Delivery / commitments" },
  { value: "other", label: "Something else" },
];

// Auto-derive a short title from the idea text so the user only types once.
// First line, trimmed of trailing punctuation, capped at ~70 chars on a word
// boundary. Backend still gets a non-empty title; the user never sees the field.
function deriveTitle(idea: string): string {
  const firstLine = idea
    .trim()
    .split("\n")[0]
    .trim()
    .replace(/[.!?,;:\s]+$/, "");
  if (firstLine.length <= 70) return firstLine;
  const cut = firstLine.slice(0, 70);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + "…";
}

export default function MyIdeasPage() {
  const tableRef = useRef<DataTableRef>(null);
  const [idea, setIdea] = useState("");
  const [category, setCategory] = useState("general");
  const createInitiative = useCreateInitiative();
  const {
    isRecording,
    transcript,
    toggleRecording,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition();

  // Speaking is the lowest-friction capture there is. Start dictation seeded
  // with whatever's already typed; on stop, merge the transcript back in.
  const handleVoiceToggle = () => {
    if (isRecording) {
      toggleRecording();
      const captured = transcript.trim();
      if (captured) {
        setIdea((prev) =>
          prev.trim() ? `${prev.trim()} ${captured}` : captured,
        );
        resetTranscript();
      }
    } else {
      toggleRecording(idea);
    }
  };

  const submit = async () => {
    if (!idea.trim()) {
      toast.error("Jot down your idea first.");
      return;
    }
    try {
      // sourceType records which door the idea came through, which is what the
      // dependency curve reads. originatorRole/independenceFlag are NOT sent:
      // the backend derives both from the caller's own place in the org tree.
      await createInitiative.mutateAsync({
        title: deriveTitle(idea),
        description: idea.trim(),
        category: category || "general",
        status: "ideated",
        sourceType: "my_ideas",
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not submit the idea",
      );
      return;
    }
    toast.success(
      "Idea submitted — you'll see feedback here once it's reviewed",
    );
    setIdea("");
    setCategory("general");
    tableRef.current?.refresh();
  };

  const columns = useMemo<DataTableColumn<Initiative>[]>(
    () => [
      {
        key: "title",
        label: "Idea",
        render: (_v: unknown, r: Initiative) => (
          <div>
            <div className="font-medium text-base-content">{r.title}</div>
            {r.description && (
              <div className="text-sm text-base-content/60">
                {r.description}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "category",
        label: "Category",
        render: (_v: unknown, r: Initiative) =>
          r.category ? (
            <Badge label={r.category} icon={null} variant="info" size="sm" />
          ) : null,
      },
      {
        key: "status",
        label: "Status",
        render: (_v: unknown, r: Initiative) => {
          const s = workflowStatusOf(r);
          return (
            <Badge
              label={STATUS_LABEL[s]}
              icon={null}
              variant={STATUS_VARIANT[s]}
              size="sm"
            />
          );
        },
      },
      {
        key: "rejectionNote",
        label: "Reviewer feedback",
        render: (_v: unknown, r: Initiative) =>
          r.rejectionNote || (
            <span className="text-base-content/40">Not reviewed yet</span>
          ),
      },
      {
        key: "updatedAt",
        label: "Updated",
        render: (_v: unknown, r: Initiative) =>
          r.updatedAt ? formatDate(r.updatedAt, "MMM DD") : "",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="My Ideas"
        label="Aavahana"
        subtitle="Turn constraints into ideas, and see what happened to each one."
      />

      <Section>
        <Section.Header
          icon={<Lightbulb className="h-4 w-4" />}
          title="Capture an idea"
          subtitle="Just write it down. One line is plenty — you can flesh it out later."
        />
        <Section.Body>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <textarea
                autoFocus
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
                }}
                placeholder="What's your idea? Type it, or tap the mic and just say it — e.g. Batch our status updates into one daily message so we stop interrupting each other."
                rows={3}
                className="textarea textarea-bordered w-full pr-14"
              />
              {isSupported && (
                <Button
                  onClick={handleVoiceToggle}
                  iconBefore={<MicIcon size="sm" />}
                  aria-label={
                    isRecording ? "Stop recording" : "Speak your idea"
                  }
                  title={isRecording ? "Stop recording" : "Speak your idea"}
                  className={cn(
                    "btn btn-circle btn-sm absolute bottom-2 right-2",
                    isRecording
                      ? "btn-error voice-ripple-animation"
                      : "btn-ghost",
                  )}
                ></Button>
              )}
            </div>
            {isRecording && (
              <p className="text-xs text-error flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-error animate-pulse" />
                Listening{transcript ? `: "${transcript}"` : "…"}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <label className="form-control">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="select select-bordered select-sm"
                  aria-label="Category"
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                color="primary"
                size="sm"
                loading={createInitiative.isPending}
                onClick={submit}
              >
                Submit idea
              </Button>
              <span className="text-xs text-base-content/50">
                Tip: ⌘/Ctrl + Enter to submit
              </span>
            </div>
          </div>
        </Section.Body>
      </Section>

      <DataTable<Initiative>
        ref={tableRef}
        title="My submissions"
        icon={<Lightbulb className="h-4 w-4" />}
        columns={columns}
        defaultPageSize={10}
        autoHeight
        emptyState={{
          resourceName: "idea",
          subtitle:
            "Nothing here yet. Your next constraint is an idea waiting to happen.",
        }}
        queryFn={async () => HcdInitiativeService.list()}
      />
    </div>
  );
}
