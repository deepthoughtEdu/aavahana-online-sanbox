"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MyIdeas } from "@/components/shared/hvt";

export default function AavahanaMyIdeasPage() {
  const router = useRouter();

  return (
    <div className="p-[24px_28px]">
      <MyIdeas onNewIdea={() => router.push("/aavahana/hvt/ideas/new")} />
    </div>
  );
}
