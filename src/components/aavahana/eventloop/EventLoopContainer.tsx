"use client";

import React from "react";
import { useEventLoop } from "@/lib/hooks/shared/use-event-loop";
import { EventLoopPanel } from "@/components/shared/event-loop";

interface Props {
  programId: string;
}

export function EventLoopContainer({ programId }: Props) {
  const { data, isLoading, error } = useEventLoop(programId);

  if (isLoading) {
    return (
      <div className="p-10 text-center dt-text-dim">
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-10 text-center text-error">
        Failed to load Event Loop data.
      </div>
    );
  }

  return <EventLoopPanel data={data} />;
}
