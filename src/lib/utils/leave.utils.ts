import type { LeaveRecord } from "@/types/aavahana/leave.types";

/**
 * Whether the LEAVE OWNER can cancel their own leave right now.
 *
 * Rules (mirror the backend in `leavesApi.cancel`):
 *   - pending / modified           → yes
 *   - approved + start in future   → yes (changed mind before the leave begins)
 *   - approved + start in the past → no (already in progress or finished)
 *   - rejected / cancelled         → no (final state)
 *
 * Approvers retain a broader ability to cancel anything — this helper is
 * specifically for the owner's own "Cancel" button visibility. The backend
 * is the source of truth; this only gates the button.
 */
export function canOwnerCancelLeave(leave: Pick<LeaveRecord, "status" | "startDate">): boolean {
  switch (leave.status) {
    case "pending":
    case "modified":
      return true;
    case "approved": {
      const start = new Date(leave.startDate).getTime();
      return Number.isFinite(start) && start > Date.now();
    }
    case "rejected":
    case "cancelled":
    default:
      return false;
  }
}
