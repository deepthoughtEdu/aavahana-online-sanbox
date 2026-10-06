// DEPRECATED: /plan/weekly — redirects to /weekly-plan/input per PDGMS v4.0 migration
import { redirect } from "next/navigation";

export default function DeprecatedWeeklyPlan() {
  redirect("/aavahana/weekly-plan/input");
}
