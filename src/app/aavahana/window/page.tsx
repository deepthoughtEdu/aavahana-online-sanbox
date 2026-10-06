"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { CommWindow } from "@/components/aavahana/window/CommWindow";

// W2.5 — the communication window. One coordination surface: ideas in flight and
// pending decisions (pending → decided → communicated, latency measured).
export default function CommunicationWindowPage() {
  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader title="Communication Window" subtitle="Ideas in flight · decisions pending" />
      <div className="w-full px-4 sm:px-6 mt-4">
        <Section>
          <Section.Body>
            <CommWindow />
          </Section.Body>
        </Section>
      </div>
    </div>
  );
}
