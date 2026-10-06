"use client";

import { useState } from "react";
import { CommunityQuizService } from "@/lib/services/aavahana/community-quiz.service";
import { toast } from "@/utils";
import type { ExportedResponse } from "@/types/aavahana/community-quiz.types";

interface Props {
  quizId: number;
}

export function ExportResponsesButton({ quizId }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await CommunityQuizService.exportResponses(quizId);
      if ("error" in result) {
        toast.error("Export failed");
        return;
      }
      const responses = result as ExportedResponse[];
      const headers = ["eid", "questionOrdinal", "questionText", "answer", "submittedAt"];
      const csvRows = [
        headers.join(","),
        ...responses.map((r) =>
          [r.eid, r.questionOrdinal, `"${r.questionText.replace(/"/g, '""')}"`, `"${r.answer.replace(/"/g, '""')}"`, r.submittedAt].join(",")
        ),
      ];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz-${quizId}-responses.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button className="btn btn-sm btn-outline" onClick={handleExport} disabled={exporting}>
      {exporting ? "Exporting…" : "Export CSV"}
    </button>
  );
}
