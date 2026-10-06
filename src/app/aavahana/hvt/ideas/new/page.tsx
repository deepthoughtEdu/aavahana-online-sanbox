"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SubmitIdea } from "@/components/shared/hvt";

export default function AavahanaSubmitIdeaPage() {
  const router = useRouter();

  return (
    <div className="p-[24px_28px]">
      <SubmitIdea onSuccess={() => router.push("/aavahana/hvt/ideas")} />
    </div>
  );
}
