"use client";

import { useAtomValue } from "jotai";
import { selectedOrgAtom } from "@/lib/store/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { HolidaysTable } from "@/app/aavahana/leaves/tables/HolidaysTable";

export default function HolidaysPage() {
  const org = useAtomValue(selectedOrgAtom);

  if (!org) {
    return (
      <EmptyState
        variant="info"
        title="Select an organisation"
        subtitle="You need an active organisation to view holidays."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Holidays"
        subtitle="Org-wide holiday calendar."
      />
      <div className="px-4 sm:px-6 py-4">
        <HolidaysTable />
      </div>
    </>
  );
}
