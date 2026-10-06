/**
 * Aavahana (L1) FeedbackContainer — thin wrapper around the shared FeedbackPanel.
 * L1 employees see: give feedback to L2 (anonymous), give peer feedback (L1),
 * and receive anonymous aggregate from L2.
 */
"use client";

import { FeedbackPanel } from "@/components/shared/feedback";

export function FeedbackContainer() {
  return <FeedbackPanel viewerLayer="L1" />;
}
