"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/shared/Button";

const STORAGE_KEY = "pdgms.cookieNotice.v1";

/**
 * Cookie notice (DPDP/GDPR item C4).
 *
 * PDGMS sets one essential session cookie, so prior consent is not required for
 * it. This is a transparency notice, not a consent gate. Dismissal is stored in
 * localStorage, so the notice creates no cookie itself.
 *
 * The one non-essential tracker (Microsoft Clarity, see ClarityProvider) is
 * opt-in behind the PLATFORM_IMPROVEMENT consent in ConsentGate and does not
 * load until that is granted, which is where its prior opt-in lives. Any future
 * non-essential cookie must be gated the same way.
 */
export function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  if (!show) {
    return null;
  }

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-4">
      <div className="flex w-full max-w-3xl items-center gap-4 rounded-xl border border-base-300 bg-base-100 p-4 shadow-lg">
        <Cookie className="size-5 shrink-0 text-primary" />
        <p className="flex-1 text-sm text-neutral">
          We use one essential cookie to keep you signed in, and no advertising cookies.
          Product-usage analytics run only if you opt in to improving the platform. Read our{" "}
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary"
          >
            privacy policy
          </a>
          .
        </p>
        <Button color="primary" size="sm" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}
