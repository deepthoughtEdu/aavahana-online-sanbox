"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { useConsentStatus, useConsentPolicies, useConsentMutations } from "@/lib/hooks/shared/use-consent";
import { notify } from "@/utils/shared/toast.utils";

/**
 * First-run consent gate (DPDP/GDPR alpha capture, T3a).
 *
 * Shows once, after login, when the user has no decision yet for either
 * PLATFORM_IMPROVEMENT or AI_COACHING. Notice text is rendered from the
 * backend (`/consent/policies`) — never hardcoded here.
 *
 * Non-blocking: the user may continue without opting into improvement.
 * Continuing always records an AI_COACHING grant (proof they saw the BYOK
 * disclosure), which also marks the gate as completed so it never reappears.
 */
export function ConsentGate() {
  const { isAuthenticated, selectedOrg } = useAuth();
  const enabled = Boolean(isAuthenticated && selectedOrg);

  const statusQuery = useConsentStatus(enabled);
  const policiesQuery = useConsentPolicies(enabled);
  const { give } = useConsentMutations();

  const [improve, setImprove] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const status = statusQuery.data;
  const policies = policiesQuery.data;

  const ready = enabled && Array.isArray(status) && Array.isArray(policies);
  const hasDecision =
    Array.isArray(status) &&
    status.some((s) => s.purposeKey === "AI_COACHING" || s.purposeKey === "PLATFORM_IMPROVEMENT");

  if (!ready || hasDecision || done) return null;

  const improvement = policies!.find((p) => p.purposeKey === "PLATFORM_IMPROVEMENT");
  const aiCoaching = policies!.find((p) => p.purposeKey === "AI_COACHING");

  async function handleContinue() {
    setSubmitting(true);
    try {
      // Always record the BYOK disclosure was seen.
      await give.mutateAsync({ purposeKey: "AI_COACHING", method: "alpha-onboarding" });
      // Record the improvement grant only if the user opted in.
      if (improve) {
        await give.mutateAsync({ purposeKey: "PLATFORM_IMPROVEMENT", method: "alpha-onboarding" });
      }
      setDone(true);
    } catch {
      notify.error("Could not save your choice. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      size="md"
      isOpen
      title="How we use your data"
      subtitle="Please take a moment before you start."
      icon={<ShieldCheck className="size-5" />}
      footer={
        <div className="flex justify-end">
          <Button color="primary" loading={submitting} onClick={handleContinue}>
            Continue
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-sm leading-relaxed text-base-content">
        <section className="space-y-2">
          <h3 className="font-semibold text-base">Improving the platform</h3>
          <p className="text-neutral">{improvement?.noticeText}</p>
          <label className="mt-2 flex items-start gap-3 rounded-lg border border-base-300 bg-base-100 p-3 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-primary mt-0.5"
              checked={improve}
              onChange={(e) => setImprove(e.target.checked)}
            />
            <span>Use my usage metadata to help improve PDGMS.</span>
          </label>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold text-base">AI features (BYOK)</h3>
          <p className="text-neutral">{aiCoaching?.noticeText}</p>
        </section>

        <section className="space-y-1">
          <h3 className="font-semibold text-base">Your choices</h3>
          <p className="text-neutral">
            You can continue either way — improvement is optional and never required to use PDGMS.
            You can change this anytime in Settings &rarr; Privacy.
          </p>
        </section>
      </div>
    </Modal>
  );
}
