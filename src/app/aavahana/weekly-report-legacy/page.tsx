// DEPRECATED: /report/weekly — redirects to /weekly-plan/report per PDGMS v4.0 migration
import { redirect } from "next/navigation";

export default function DeprecatedWeeklyReport() {
  redirect("/aavahana/weekly-report");
}
