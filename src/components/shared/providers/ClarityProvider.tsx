"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAtomValue } from "jotai";
import { selectedDeptAtom, selectedOrgAtom, userAtom, userRoleAtom } from "@/lib/store/auth";
import { useConsentStatus } from "@/lib/hooks/shared/use-consent";
import {
  CLARITY_PROJECT_ID,
  CLARITY_REQUIRES_CONSENT,
  bootClarity,
  clarityEvent,
  clarityIdentify,
  claritySetConsent,
  claritySetTag,
  isClarityConfigured,
} from "@/lib/analytics/clarity";
import { resolveModule } from "@/lib/analytics/modules";

/**
 * Microsoft Clarity wiring — module-level product analytics.
 *
 * Renders nothing. On every navigation it stamps the current product module
 * (Aavahana / CRM / Trinethra / ...) onto the Clarity session as a tag and
 * fires a `module_view` event, so the dashboard can answer "how many distinct
 * users opened CRM this week" and "which modules does this org actually use".
 *
 * Tags written (all pseudonymous — no email, no display name):
 *   module, module_key, module_section, org, org_id, dept, dept_id, role, env
 *
 * Gating: does nothing unless NEXT_PUBLIC_CLARITY_PROJECT_ID is set, and (by
 * default) unless the user granted PLATFORM_IMPROVEMENT in the consent gate.
 * See `lib/analytics/clarity.ts` for the consent escape hatch.
 */
export function ClarityProvider() {
  const pathname = usePathname();
  const user = useAtomValue(userAtom);
  const org = useAtomValue(selectedOrgAtom);
  const dept = useAtomValue(selectedDeptAtom);
  const role = useAtomValue(userRoleAtom);

  const configured = isClarityConfigured();
  const consentQueryEnabled = configured && CLARITY_REQUIRES_CONSENT && Boolean(user && org);
  const consentQuery = useConsentStatus(consentQueryEnabled);

  const consentGranted = useMemo(() => {
    if (!CLARITY_REQUIRES_CONSENT) return true;
    const status = consentQuery.data;
    if (!Array.isArray(status)) return false;
    return status.some((entry) => entry.purposeKey === "PLATFORM_IMPROVEMENT" && entry.granted);
  }, [consentQuery.data]);

  const shouldTrack = configured && consentGranted;
  const [booted, setBooted] = useState(false);

  // Load the tag once the gate opens. Consent can flip mid-session (the gate
  // resolves after login), so this is an effect rather than a render-time call.
  useEffect(() => {
    if (!configured) return;

    if (shouldTrack) {
      if (booted) return;
      if (bootClarity(CLARITY_PROJECT_ID)) {
        claritySetConsent(true);
        setBooted(true);
      }
      return;
    }

    // Consent withdrawn from /aavahana/settings/privacy mid-session. The tag
    // cannot be unloaded without a reload, so drop it to cookie-less mode and
    // stop feeding it tags until the next page load.
    if (booted) {
      claritySetConsent(false);
      setBooted(false);
    }
  }, [configured, shouldTrack, booted]);

  // Identity + org context. Re-runs on org/dept switch so a session that moves
  // between orgs carries both values.
  useEffect(() => {
    if (!booted) return;
    if (user?.uid) {
      clarityIdentify(String(user.uid));
    }
    if (org?.orgId) {
      claritySetTag("org_id", org.orgId);
    }
    if (org?.name) {
      claritySetTag("org", org.name);
    }
    if (dept?._id) {
      claritySetTag("dept_id", dept._id);
    }
    if (dept?.name) {
      claritySetTag("dept", dept.name);
    }
    if (role) {
      claritySetTag("role", String(role));
    }
    claritySetTag("env", process.env.NODE_ENV ?? "unknown");
  }, [booted, user?.uid, org?.orgId, org?.name, dept?._id, dept?.name, role]);

  // Module attribution — the part that answers the usage question.
  const lastTagged = useRef<string | null>(null);
  useEffect(() => {
    if (!booted) {
      // Re-tag from scratch if tracking is resumed later in the session.
      lastTagged.current = null;
      return;
    }
    if (!pathname) return;

    const moduleInfo = resolveModule(pathname);
    const fingerprint = `${moduleInfo.key}|${moduleInfo.section ?? ""}`;
    if (lastTagged.current === fingerprint) return;
    lastTagged.current = fingerprint;

    claritySetTag("module", moduleInfo.label);
    claritySetTag("module_key", moduleInfo.key);
    if (moduleInfo.section) {
      claritySetTag("module_section", `${moduleInfo.key}/${moduleInfo.section}`);
    }
    if (!moduleInfo.known) {
      // A route segment nobody registered in lib/analytics/modules.ts.
      claritySetTag("module_unmapped", moduleInfo.key);
    }
    if (user?.uid) {
      // customPageId groups Clarity's page view under the module.
      clarityIdentify(String(user.uid), moduleInfo.key);
    }
    clarityEvent(`module_view:${moduleInfo.key}`);
  }, [booted, pathname, user?.uid]);

  return null;
}
