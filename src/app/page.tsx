// src/app/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/aavahana");
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}
