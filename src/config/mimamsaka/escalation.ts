/**
 * escalation.ts — SLA defaults per escalation type.
 * Used by ELTickets.tsx to show SLA countdown per pending ticket.
 */

export type EscalationType = "blocker" | "decision" | "info";

/** Default SLA in hours per escalation type. */
export const SLA_DEFAULTS: Record<EscalationType, number> = {
  blocker:  4,
  decision: 24,
  info:     48,
};

/** Human-readable SLA label. */
export function formatSLA(hours: number): string {
  if (hours < 1)  return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * Compute how many hours remain given a createdAt timestamp and slaHours.
 * Returns negative values when overdue.
 */
export function slaRemainingHours(createdAt: string, slaHours: number): number {
  const created  = new Date(createdAt).getTime();
  const deadline = created + slaHours * 60 * 60 * 1000;
  const now      = Date.now();
  return (deadline - now) / (1000 * 60 * 60);
}

/** Returns a colour token string based on remaining SLA. */
export function slaUrgencyColor(remainingHours: number): string {
  if (remainingHours < 0)   return "var(--dt-red)";   // overdue → red
  if (remainingHours < 1)   return "var(--dt-amber)";  // < 1h    → deep amber
  if (remainingHours < 4)   return "var(--dt-amber)";  // < 4h    → amber
  return "var(--dt-green)";                            // ok      → green
}
