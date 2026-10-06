"use client";

import { useAtomValue } from "jotai";
import { Button } from "@/components/shared/Button";
import { useBlockList } from "@/lib/hooks/hcd/use-block";
import { useMyDrills } from "@/lib/hooks/hcd/use-drills";
import { useInitiativeList } from "@/lib/hooks/hcd/use-initiatives";
import { useImpactSummary } from "@/lib/hooks/hcd/use-recognition";
import { useSuggestFramework } from "@/lib/hooks/hcd/use-coaching";
import { hcdByokAtom } from "@/lib/store/hcd/hcd-byok.store";

export type HcdStage = "Assess" | "Apply" | "Innovate" | "Prove";

const ORDER: HcdStage[] = ["Assess", "Apply", "Innovate", "Prove"];

interface FlowStep {
  step: number;
  /** Journey phase name shown next to the step number. */
  phase: string;
  tab: HcdStage;
  title: string;
  instruction: string;
  cta: string;
  /** Element id to scroll to once the tab is active. */
  target: string;
  /** Special action: open the assessment directly instead of just scrolling. */
  action?: "assessment";
}

/**
 * Persistent, state-aware guide that always answers "where am I and what do I
 * do next." It reads the user's progress (drills, initiatives, verified impact)
 * and surfaces the single next action, with a button that takes them there — so
 * the four stages read as one seamless flow rather than four separate screens.
 */
export function FlowGuide({
  currentTab,
  onGo,
  onStartAssessment,
}: {
  currentTab: HcdStage;
  onGo: (tab: HcdStage, target: string) => void;
  /** Opens an assessment. Pass a block id to open that framework's block. */
  onStartAssessment: (blockId?: number) => void;
}) {
  const { data: blocks } = useBlockList();
  const { data: drills } = useMyDrills();
  const { data: initiatives } = useInitiativeList();
  const { data: summary } = useImpactSummary();
  const byok = useAtomValue(hcdByokAtom);
  const suggest = useSuggestFramework();

  const activeDrills = drills?.length ?? 0;
  const inits = initiatives ?? [];
  const hasIdeas = inits.length > 0;
  const hasSubmitted = inits.some((i) => i.verificationStatus === "submitted");
  const hasPiloted = inits.some((i) => i.status === "piloted" && !i.verificationStatus);
  const verified = summary?.verifiedCount ?? 0;
  // "Assessed" means the user has progressed past the first step. It is true when
  // any block is marked completed, when active drills exist (drills are only
  // assigned post-assessment, so their presence implies a prior assessment), or
  // when the user has already submitted an idea / gained verified impact.
  const assessed =
    (blocks ?? []).some((b) => b.completed) ||
    activeDrills > 0 ||
    hasSubmitted ||
    verified > 0;

  // The journey: 1 Assess → 2 Practice (drills) → 3 Apply (frameworks + ideas) →
  // 4 Prove. Completing the assessment moves you to Practice, so the step number
  // actually advances instead of sitting on 1 while you work through drills.
  const flow: FlowStep = (() => {
    if (!assessed)
      return {
        step: 1,
        phase: "Assess",
        tab: "Assess",
        title: "Start with an assessment",
        instruction: "Answer honestly — it pinpoints exactly where your gaps are.",
        cta: "Take an assessment",
        target: "hcd-blocks",
        action: "assessment",
      };
    if (activeDrills > 0)
      return {
        step: 2,
        phase: "Practice",
        tab: "Assess",
        title: `Practice your ${activeDrills} drill${activeDrills > 1 ? "s" : ""}`,
        instruction:
          "Assessment done ✓ — now do each drill in your real work, then mark it Done.",
        cta: "Go to drills",
        target: "hcd-drills",
      };
    if (hasSubmitted)
      return {
        step: 4,
        phase: "Prove",
        tab: "Prove",
        title: "Track your verification",
        instruction: "Submitted work gets verified here — watch your impact grow.",
        cta: "Go to Prove",
        target: "hcd-prove",
      };
    if (hasPiloted)
      return {
        step: 3,
        phase: "Apply",
        tab: "Innovate",
        title: "Submit your piloted improvement",
        instruction: "Submit it for verification so the impact actually counts.",
        cta: "Open Idea board",
        target: "hcd-innovate",
      };
    if (hasIdeas)
      return {
        step: 3,
        phase: "Apply",
        tab: "Innovate",
        title: "Develop your idea",
        instruction: "Advance it Ideated → Prototyped → Piloted, then submit it.",
        cta: "Open Idea board",
        target: "hcd-innovate",
      };
    if (verified > 0)
      return {
        step: 4,
        phase: "Prove",
        tab: "Assess",
        title: "Keep the loop going",
        instruction: "You proved impact. Re-assess or capture another idea to grow further.",
        cta: "Re-assess",
        target: "hcd-blocks",
      };
    return {
      step: 3,
      phase: "Apply",
      tab: "Apply",
      title: "Apply a framework to real work",
      instruction: "Drills done ✓ — copy a prompt or use the coach, then capture what you do as an idea.",
      cta: "Open Apply",
      target: "hcd-apply",
    };
  })();

  return (
    <div className="rounded-[9px] border border-primary/30 bg-primary/5 px-4 py-4 sm:px-5">
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex w-9 h-9 shrink-0 rounded-full bg-primary text-primary-content items-center justify-center font-bold text-sm">
          {flow.step}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary mb-0.5">
            Step {flow.step} of 4 · {flow.phase}
          </p>
          <h3 className="font-semibold text-black">{flow.title}</h3>
          <p className="text-xs dt-text-dim mt-0.5">{flow.instruction}</p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            color="primary"
            size="sm"
            onClick={() =>
              flow.action === "assessment"
                ? onStartAssessment()
                : onGo(flow.tab, flow.target)
            }
          >
            {currentTab === flow.tab ? flow.cta : `Go to ${flow.tab}`}
          </Button>
          {/* A key connected this session is sent along; without one the
              server uses the key the person saved under Account → API keys. */}
          {currentTab === "Assess" && (
            <Button
              color="primary"
              variant="outline"
              size="sm"
              loading={suggest.isPending}
              onClick={() => suggest.mutate(byok)}
            >
              Suggest personalized framework
            </Button>
          )}
        </div>
      </div>

      {currentTab === "Assess" && suggest.isError && (
        <p className="text-xs text-error mt-3">{suggest.error.message}</p>
      )}

      {currentTab === "Assess" && suggest.isSuccess && (
        <div className="mt-3 rounded-[9px] border border-primary/30 bg-base-100 overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-base-300 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary mb-1">
                Suggested framework · weekly report {suggest.data.reportPeriodLabel}
              </p>
              <h4 className="text-lg font-semibold text-black leading-tight">
                {suggest.data.frameworkName}
              </h4>
            </div>
            <button
              onClick={() => suggest.reset()}
              className="btn btn-ghost btn-xs shrink-0"
            >
              Dismiss
            </button>
          </div>

          <div className="px-4 py-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide dt-text-dim mb-1.5">
                Why this fits
              </p>
              <p className="text-sm leading-relaxed text-black border-l-2 border-primary/40 pl-3">
                {suggest.data.rationale}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide dt-text-dim mb-1.5">
                From your week
              </p>
              <ul className="space-y-1.5">
                {suggest.data.signals.map((s) => (
                  <li
                    key={s}
                    className="text-sm leading-snug text-black flex gap-2"
                  >
                    <span className="text-primary font-bold shrink-0">·</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              color="primary"
              size="sm"
              onClick={() => onStartAssessment(suggest.data.suggestedBlockId)}
            >
              Start this assessment
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-1 mt-3">
        {ORDER.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < flow.step ? "bg-primary" : "bg-base-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
