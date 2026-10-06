"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAtomValue } from "jotai";
import { userAtom } from "@/lib/store/auth";
import { AppliedTable } from "@/app/aavahana/leaves/tables/AppliedTable";
import { ApplyModal } from "./ApplyModal";
import { LeaveBalanceStrip } from "./LeaveBalanceStrip";
import { ProfileCompletionPrompt } from "./ProfileCompletionPrompt";
import { EditModal } from "./EditModal";
import { LeaveService } from "@/lib/services/aavahana/leave.service";
import { isError } from "@/lib/api/client";
import { toast } from "@/utils";
import type { LeaveApprovalRow } from "@/types/aavahana/leave.types";

/**
 * "My Leaves" — every leave the user has filed, in one screen.
 *
 * Sections (stacked, no in-page tab strip):
 *   - Current : pending + recently-decided requests the user is tracking
 *   - History : older decisions
 *
 * Holidays, Approvals (manager-only), and Profile live on their own routes
 * under /aavahana/leaves/{holidays,approvals,profile}. Sidebar drives nav.
 *
 * Legacy email-CTA back-compat — links like /aavahana/leaves?tab=approvals
 * get redirected to /aavahana/leaves/{approvals,holidays} so old emails work.
 * The /aavahana/leaves?review=<id>&token=<approvalToken> deep link
 * (EditModal verify flow) is preserved.
 */

// Legacy ?tab= values → new route paths. Anything not in this map keeps the
// user on /aavahana/leaves (current + history are visible here regardless).
// Approvals now live in Trinethra (L2) — legacy approver links forward there.
const TAB_REDIRECTS: Record<string, string> = {
  approvals: "/trinethra/leaves",
  approved: "/trinethra/leaves",
  holidays: "/aavahana/leaves/holidays",
};

export function LeavesManager() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAtomValue(userAtom);

  // ── Legacy ?tab= back-compat ──
  // Old emails sent users to /aavahana/leaves?tab=approvals (etc). Redirect
  // them to the new dedicated routes once, on first render.
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (redirectedRef.current) return;
    const tab = searchParams.get("tab");
    if (!tab) return;
    const target = TAB_REDIRECTS[tab];
    if (!target) return;
    redirectedRef.current = true;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("tab");
    const qs = next.toString();
    router.replace(qs ? `${target}?${qs}` : target);
  }, [searchParams, router]);

  const [applyOpen, setApplyOpen] = useState(false);
  const [deepLinkLeave, setDeepLinkLeave] = useState<LeaveApprovalRow | null>(
    null,
  );

  // Email CTA flow: `?review=<id>&token=<approvalToken>` opens the EditModal
  // for that leave once the link is verified by the backend. If the user
  // isn't logged in, bounce through /auth/login with the full current URL
  // as the redirect target so the params survive the round-trip.
  const reviewParam = searchParams.get("review");
  const tokenParam = searchParams.get("token");
  // Guard against double-firing across re-renders (e.g. Strict Mode in dev).
  const verifiedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!reviewParam || !tokenParam) return;
    const key = `${reviewParam}:${tokenParam}`;
    if (verifiedKeyRef.current === key) return;

    if (!user) {
      const here =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "";
      router.replace(`/auth/login?redirect=${encodeURIComponent(here)}`);
      return;
    }

    verifiedKeyRef.current = key;
    const id = Number(reviewParam);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error("This link is no longer valid");
      return;
    }

    (async () => {
      const res = await LeaveService.verifyLink(id, tokenParam);
      if (isError(res)) {
        toast.error("This link is no longer valid");
        return;
      }
      setDeepLinkLeave(res);
    })();
  }, [reviewParam, tokenParam, user, router]);

  // When the user closes the deep-linked modal, strip the review/token from
  // the URL so a refresh or back-nav doesn't re-trigger the verify flow.
  const closeDeepLink = () => {
    setDeepLinkLeave(null);
    if (reviewParam || tokenParam) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("review");
      next.delete("token");
      const qs = next.toString();
      router.replace(qs ? `/aavahana/leaves?${qs}` : "/aavahana/leaves");
    }
  };

  return (
    <>
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <ProfileCompletionPrompt />
        <LeaveBalanceStrip />
        <AppliedTable onApply={() => setApplyOpen(true)} />
      </div>

      <ApplyModal isOpen={applyOpen} onClose={() => setApplyOpen(false)} />
      <EditModal
        isOpen={!!deepLinkLeave}
        onClose={closeDeepLink}
        leave={deepLinkLeave}
      />
    </>
  );
}
