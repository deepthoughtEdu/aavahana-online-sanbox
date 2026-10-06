"use client";

import { useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { Badge } from "@/components/shared/Badge";
import { useConsentStatus, useConsentPolicies, useConsentMutations } from "@/lib/hooks/shared/use-consent";
import { notify } from "@/utils/shared/toast.utils";

/**
 * Settings → Privacy (DPDP/GDPR alpha capture, T3b).
 *
 * Shows the current improvement-consent state and lets the user grant or
 * withdraw it. Withdrawal must be as easy as giving — reachable in two clicks
 * (Settings → Privacy → toggle). Notice text is rendered from the backend.
 */
export default function PrivacySettingsPage() {
  const statusQuery = useConsentStatus();
  const policiesQuery = useConsentPolicies();
  const { give, withdraw } = useConsentMutations();
  const [busy, setBusy] = useState(false);

  const status = statusQuery.data;
  const policies = policiesQuery.data;

  const improvement = policies?.find((p) => p.purposeKey === "PLATFORM_IMPROVEMENT");
  const aiCoaching = policies?.find((p) => p.purposeKey === "AI_COACHING");
  const improvementOn = Boolean(status?.find((s) => s.purposeKey === "PLATFORM_IMPROVEMENT")?.granted);

  async function handleToggle(next: boolean) {
    setBusy(true);
    try {
      if (next) {
        await give.mutateAsync({ purposeKey: "PLATFORM_IMPROVEMENT", method: "settings" });
        notify.success("Improvement sharing turned on.");
      } else {
        await withdraw.mutateAsync({ purposeKey: "PLATFORM_IMPROVEMENT" });
        notify.success("Improvement sharing turned off.");
      }
    } catch {
      notify.error("Could not update your choice. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        label="Settings"
        title="Privacy"
        subtitle="Control how your data is used. You can change these anytime."
      />

      <div className="space-y-6">
        <Section variant="default">
          <Section.Header
            icon={<ShieldCheck className="size-5" />}
            title="Improving the platform"
            subtitle="Optional — never required to use PDGMS."
          >
            <Badge
              label={improvementOn ? "On" : "Off"}
              variant={improvementOn ? "success" : "neutral"}
              size="sm"
            />
          </Section.Header>
          <Section.Body>
            <p className="text-sm leading-relaxed text-neutral">{improvement?.noticeText}</p>
            <label className="mt-4 flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={improvementOn}
                disabled={busy || statusQuery.isLoading}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              <span className="text-sm font-medium">
                Use my usage metadata to help improve PDGMS
              </span>
            </label>
          </Section.Body>
        </Section>

        <Section variant="default">
          <Section.Header
            icon={<Sparkles className="size-5" />}
            title="AI features (BYOK)"
            subtitle="What using your own API key means for your data."
          />
          <Section.Body>
            <p className="text-sm leading-relaxed text-neutral">{aiCoaching?.noticeText}</p>
          </Section.Body>
        </Section>
      </div>
    </>
  );
}
