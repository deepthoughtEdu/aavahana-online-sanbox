"use client";

import { useAtomValue } from "jotai";
import { selectedOrgAtom } from "@/lib/store/auth";
import { EmptyState } from "@/components/shared/EmptyState";
import { AttendanceManager } from "@/components/aavahana/attendance/AttendanceManager";

export default function AttendancePage() {
  const org = useAtomValue(selectedOrgAtom);

  if (!org) {
    return (
      <EmptyState
        variant="info"
        title="Select an organisation"
        subtitle="You need an active organisation to view attendance."
      />
    );
  }

  // The header lives in AttendanceManager — it carries the month navigator, and
  // that has to sit next to the month state it drives.
  return <AttendanceManager />;
}
