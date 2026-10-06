// The AI weekly report is now the canonical /aavahana/weekly-report
// (daily reports → generate → edit → submit).
import { redirect } from "next/navigation";

export default function WeeklyReportAiPage() {
  redirect("/aavahana/weekly-report");
}
