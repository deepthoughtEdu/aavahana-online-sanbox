"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { useAnswerSupport, useSupportFollowUp } from "@/lib/hooks/aavahana/use-compassion";
import type { SupportOutcome } from "@/types/aavahana/compassion.types";

export function CareFollowUp({ owner, onMoreSupport }: { owner: string; onMoreSupport: () => void }) {
  const query = useSupportFollowUp(owner);
  const answer = useAnswerSupport();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [answeredId, setAnsweredId] = useState<string>();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  const followUp = query.data?.followUp;
  const due = followUp && new Date(followUp.dueAt).getTime() <= Date.now();

  async function respond(outcome: SupportOutcome) {
    if (!followUp || answer.isPending) return;
    setError("");
    try {
      await answer.mutateAsync({ id: followUp.id, outcome });
      if (!alive.current) return;
      setAnsweredId(followUp.id);
      setNotice(outcome === "helped" ? "Thanks for telling me. This follow-up is closed." :
        outcome === "not_helpful" ? "We can try a different kind of support. This follow-up is closed." :
          "This follow-up is closed. There is nothing to make up for.");
      if (outcome === "not_helpful") onMoreSupport();
    } catch {
      if (alive.current) setError("Your answer was not saved. Try again when you are ready.");
    }
    finally { answer.reset(); }
  }

  if (query.isError) return <p className="text-sm text-base-content/75">Your support follow-up could not load. You can still finish your report.</p>;
  if (!followUp || answeredId === followUp.id) return notice ? <p role="status" className="text-sm">{notice}</p> : null;
  return (
    <section aria-label="Your support follow-up" data-clarity-mask="true" className="flex w-full flex-col gap-3 border-b border-base-content/15 pb-4 text-left">
      <h3 className="text-base font-semibold">{due ? "You wanted to try one small step" : "Saved for tomorrow"}</h3>
      <p className="text-sm">{followUp.step.label}</p>
      {due && <p className="text-sm">Did it make your day easier?</p>}
      <div className="flex flex-wrap gap-2">
        {due && <>
          <Button color="neutral" variant="outline" disabled={answer.isPending} onClick={() => respond("helped")}>It helped</Button>
          <Button color="neutral" variant="outline" disabled={answer.isPending} onClick={() => respond("not_helpful")}>Not really</Button>
          <Button color="neutral" variant="ghost" disabled={answer.isPending} onClick={() => respond("not_tried")}>Didn&apos;t get to it</Button>
        </>}
        <Button color="neutral" variant="ghost" disabled={answer.isPending} onClick={() => respond("dismissed")}>Forget this step</Button>
      </div>
      {answer.isPending && <p role="status" className="text-sm">Saving your answer…</p>}
      {error && <p role="alert" className="text-sm">{error}</p>}
    </section>
  );
}
