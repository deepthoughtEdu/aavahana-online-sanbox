import { useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "@/lib/hooks/shared/use-api";
import { CallingTargetsService } from "@/lib/services/crm/calling-targets.service";
import type { CallingProgramProgress, CallingPace } from "@/types/crm/calling-targets.types";

const CQ = ["crm", "calling-targets"] as const;

/**
 * The caller's own bars, progress and pace.
 *
 * `refetchInterval` is the nudge cadence the SERVER declared for their team (15 minutes for both
 * teams today), not a number picked here — so changing the cadence is a config change, never a
 * frontend deploy. It only polls while the caller is inside their push window; outside it there is
 * nothing to say, and polling all day for no reason is how a dashboard becomes a background tax on
 * every page load.
 */
export function useMyCallingProgress(enabled = true) {
  const [interval, setIntervalMs] = useState<number | false>(false);

  const q = useApi({
    queryKey: [...CQ, "me"],
    queryFn: () => CallingTargetsService.getMyProgress(),
    enabled,
    refetchInterval: interval,
  });

  const programs: CallingProgramProgress[] = useMemo(
    () => (q.data?.programs ?? []) as CallingProgramProgress[],
    [q.data]
  );

  // Poll on the team's own beat while any program is mid-window; stop otherwise.
  useEffect(() => {
    const active = programs.find((p) => p.pace?.inWindow);
    if (!active) {
      setIntervalMs(false);
      return;
    }
    const mins = active.nudgeIntervalMinutes > 0 ? active.nudgeIntervalMinutes : 15;
    setIntervalMs(mins * 60 * 1000);
  }, [programs]);

  return { ...q, programs };
}

/** The frozen closed periods a bonus is released on. Defaults to this quarter. */
export function useMyCallingConsistency(enabled = true, range?: { from?: string; to?: string }) {
  return useApi({
    queryKey: [...CQ, "me", "consistency", range?.from ?? "q", range?.to ?? "now"],
    queryFn: () => CallingTargetsService.getMyConsistency(range),
    enabled,
  });
}

/** A whole team's standing. The server allows this only for the program's TPM or an org admin. */
export function useCallingProgramBoard(programId?: number) {
  return useApi({
    queryKey: [...CQ, "board", programId],
    queryFn: () => CallingTargetsService.getProgramBoard(programId as number),
    enabled: !!programId,
  });
}

/**
 * The words the nudge actually says, and whether it should fire at all.
 *
 * Two jobs, and they pull in opposite directions. The team is nervous about cold calling, so being
 * behind has to read as what is still reachable rather than what has been lost. And the number is
 * genuinely owed — it changes week to week and the quarterly bonus turns on meeting it — so the
 * copy states it plainly and never softens it into a suggestion.
 *
 * Nothing here invents encouragement. It says the number, where they stand, and what the rate is.
 */
export function paceMessage(pace: CallingPace | null): { title: string; detail: string; tone: "ok" | "push" | "done" } | null {
  if (!pace) return null;
  if (pace.done_early) {
    return {
      title: `${pace.done} done — target cleared`,
      detail: "The rest of the window is yours.",
      tone: "done",
    };
  }
  const mins = pace.minutesLeft;
  const timeLeft = mins >= 60
    ? `${Math.floor(mins / 60)}h ${mins % 60}m left`
    : `${mins}m left`;
  if (pace.onPace) {
    return {
      title: `${pace.done} of ${pace.target}`,
      detail: `On pace. ${pace.remaining} to go, ${timeLeft}.`,
      tone: "ok",
    };
  }
  return {
    title: `${pace.done} of ${pace.target}`,
    // Reachable, not lost: the rate needed from here, never the deficit against where they "should"
    // have been.
    detail: `${pace.remaining} to go, ${timeLeft}. ${pace.neededPerHour} an hour gets you there.`,
    tone: "push",
  };
}

/**
 * Fires a browser notification on the team's beat while the caller is inside their window.
 *
 * Never asks for permission on its own. Permission is requested only when the caller presses the
 * bell in the dialler, because a permission prompt nobody invited is how a team turns notifications
 * off permanently — and then the nudge is dead for good.
 */
export function useCallingNudge(programs: CallingProgramProgress[], enabled: boolean) {
  const lastFired = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const active = programs.find((p) => p.pace?.inWindow);
    if (!active?.pace) return;

    const msg = paceMessage(active.pace);
    if (!msg) return;

    // One notification per beat, not one per render. The key changes when the numbers change or the
    // window moves on, so a re-render with identical state stays silent.
    const beat = active.nudgeIntervalMinutes > 0 ? active.nudgeIntervalMinutes : 15;
    const bucket = Math.floor(active.pace.minutesLeft / beat);
    const key = `${active.programId}:${bucket}:${active.pace.done}`;
    if (lastFired.current === key) return;
    lastFired.current = key;

    try {
      new Notification(`${active.programName} — ${msg.title}`, { body: msg.detail, tag: "pdgms-calling-pace" });
    } catch {
      // A blocked or unsupported notification must never break the dialler the caller is working in.
    }
  }, [programs, enabled]);
}
