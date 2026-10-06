"use client";

import Link from "next/link";
import { useAtomValue } from "jotai";
import { selectedOrgAtom } from "@/lib/store/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LeavesManager } from "@/components/aavahana/leaves/LeavesManager";

export default function LeavesPage() {
  const org = useAtomValue(selectedOrgAtom);

  if (!org) {
    return (
      <EmptyState
        variant="info"
        title="Select an organisation"
        subtitle="You need an active organisation to manage leaves."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Leave Management"
        subtitle="Apply for leaves, review pending decisions, and track history."
      >
        <Link
          href="/aavahana/leaves/profile"
          className="text-sm font-medium px-3 py-2 rounded-md border border-base-300 hover:bg-base-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
        >
          My profile
        </Link>
      </PageHeader>
      <LeavesManager />
    </>
  );
}
