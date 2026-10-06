"use client";

import { EventLoopContainer } from "@/components/aavahana/eventloop/EventLoopContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/lib/hooks/shared/use-auth";

export default function AavahanaEventLoopPage() {
  const { selectedProgram } = useAuth();

  if (!selectedProgram) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="alert alert-warning max-w-md">
          <span>No program context — you must be a member of a program to view the Event Loop.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader
        title="Event Loop"
        subtitle="Not everything can be planned. When unplanned work arrives, log it here — the system tracks the cost to your plan, credits the time to your report, and escalates when needed. Organisations that see their unplanned work learn to reduce it."
      />
      <div className="w-full px-4 sm:px-6 mt-4">
        <EventLoopContainer programId={selectedProgram.id} />
      </div>
    </div>
  );
}
