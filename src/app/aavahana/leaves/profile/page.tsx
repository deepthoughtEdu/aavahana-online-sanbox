"use client";

import { useAtomValue } from "jotai";
import { selectedOrgAtom } from "@/lib/store/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProfileContainer } from "@/components/aavahana/leaves/profile/ProfileContainer";

export default function ProfilePage() {
  const org = useAtomValue(selectedOrgAtom);

  if (!org) {
    return (
      <EmptyState
        variant="info"
        title="Select an organisation"
        subtitle="You need an active organisation to view your profile."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Your employment details, working schedule, and banking information."
      />
      <ProfileContainer />
    </>
  );
}
