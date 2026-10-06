"use client";

import { useIP } from "@/lib/hooks/aavahana/use-ip";
import { IPContainer } from "@/components/aavahana/ip/IPContainer";
import { PageHeader } from "@/components/shared/PageHeader";

export default function IPPage() {
  const ipData = useIP();

  if (ipData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (ipData.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="alert alert-error max-w-md">
          <span>{ipData.error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      <PageHeader
        title="Intellectual Property"
        label="Aavahana"
        subtitle={`${ipData.monthLabel} — IP goals and commit tracking`}
      />

      <div>
        <IPContainer ipData={ipData} />
      </div>
    </div>
  );
}

