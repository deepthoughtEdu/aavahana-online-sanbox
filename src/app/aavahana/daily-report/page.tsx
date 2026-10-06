"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DailyReportV8 } from "@/components/aavahana/report/daily/v8/DailyReportV8";
import { DailyReportV7Engine } from "@/components/aavahana/report/daily/v7/DailyReportV7Engine";

/**
 * Daily report — the v8 single-screen "Close your day" card by default.
 * `?engine=v7` keeps the previous conversation engine reachable as an escape
 * hatch while v8 bakes (both write the same backend rows, so switching is safe).
 */
function DailyReportSwitch() {
  const params = useSearchParams();
  if (params.get("engine") === "v7") return <DailyReportV7Engine />;
  return <DailyReportV8 />;
}

export default function DailyReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      }
    >
      <DailyReportSwitch />
    </Suspense>
  );
}
