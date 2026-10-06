"use client";

/**
 * PdgmsNotificationItem
 *
 * Renders a single PDGMS business notification inside the inbox panel.
 * Distinct from NotificationItem (which handles generic toast notifications)
 * because the PdgmsNotification shape is different: id is a number, readAt is an
 * ISO string instead of a boolean, and type is a business event type.
 *
 * On click: marks the notification read (optimistic) and navigates to the entity.
 */
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { isError } from "@/lib/api/client";
import { NotificationService } from "@/lib/services/shared/notification.service";
import { logger } from "@/lib/managers/logger";
import { ignoreTextSelection } from "@/utils/shared/selection.utils";
import type { PdgmsNotification } from "@/types";

interface PdgmsNotificationItemProps {
  notification: PdgmsNotification;
  onClose: () => void;
}

/**
 * Maps each PdgmsNotificationType to a human-readable label and icon character.
 * Icons are text-based to avoid adding an icon dependency per notification type.
 */
function getTypePresentation(type: PdgmsNotification["type"]): {
  icon: string;
  label: string;
  colorClass: string;
} {
  switch (type) {
    // ── Tickets ──────────────────────────────────────────────────────────────
    case "ticket_assigned":
      return { icon: "🎫", label: "Ticket assigned", colorClass: "text-blue-600" };
    case "ticket_status_changed":
      return { icon: "🔄", label: "Ticket updated", colorClass: "text-blue-500" };
    case "constraint_assigned":
    case "constraint_ticket_assigned":
      return { icon: "🚩", label: "Constraint routed", colorClass: "text-orange-600" };

    // ── Reporting / compliance ───────────────────────────────────────────────
    case "qa_aging":
      return { icon: "⏳", label: "QA aging", colorClass: "text-amber-600" };
    case "scoring_due":
      return { icon: "📊", label: "Score submitted", colorClass: "text-purple-600" };
    case "deadline_approaching":
      return { icon: "🕐", label: "Deadline approaching", colorClass: "text-red-500" };
    case "report_due":
      return { icon: "📝", label: "Report due", colorClass: "text-gray-600" };
    case "report_not_submitted":
      return { icon: "📄", label: "Report overdue", colorClass: "text-red-600" };
    case "non_compliance":
    case "recurring_noncompliance":
      return { icon: "🔴", label: "Non-compliance", colorClass: "text-red-700" };

    // ── Sprints / deviations ─────────────────────────────────────────────────
    case "deviation_fired":
    case "deviation_trigger_fired":
      return { icon: "⚠️", label: "Deviation alert", colorClass: "text-yellow-600" };
    case "sprint_activated":
      return { icon: "🚀", label: "Sprint activated", colorClass: "text-green-600" };

    // ── Growth / HCD ─────────────────────────────────────────────────────────
    case "growth_constraint_spotted":
      return { icon: "🔎", label: "Constraint spotted", colorClass: "text-orange-600" };
    case "growth_constraint_evidence":
      return { icon: "➕", label: "Constraint evidence added", colorClass: "text-orange-500" };
    case "hcd_insight_alert":
      return { icon: "💡", label: "Insight detected", colorClass: "text-amber-700" };

    // ── Identity cadence ─────────────────────────────────────────────────────
    case "identity_retake_due":
      return { icon: "🧭", label: "Identity retake due", colorClass: "text-teal-600" };
    case "identity_completed":
      return { icon: "✅", label: "Identity completed", colorClass: "text-teal-700" };
    case "identity_mentee_overdue":
    case "identity_report_overdue":
      return { icon: "🧭", label: "Identity overdue", colorClass: "text-red-500" };

    // ── Socratic ─────────────────────────────────────────────────────────────
    case "socratic_review_assigned":
      return { icon: "🗣️", label: "Review assigned", colorClass: "text-violet-600" };

    // ── Community quiz ───────────────────────────────────────────────────────
    case "community_quiz_status":
      return { icon: "🧩", label: "Quiz updated", colorClass: "text-cyan-600" };
    case "community_quiz_participant_joined":
      return { icon: "🙋", label: "Participant joined", colorClass: "text-cyan-700" };

    // ── CRM ──────────────────────────────────────────────────────────────────
    case "crm_escalation":
      return { icon: "📣", label: "Escalation", colorClass: "text-rose-600" };
    case "crm_deviation_yellow":
      return { icon: "🟡", label: "Account deviation", colorClass: "text-yellow-600" };
    case "crm_deviation_orange":
      return { icon: "🟠", label: "Account deviation", colorClass: "text-orange-600" };
    case "crm_deviation_red":
      return { icon: "🔴", label: "Account deviation", colorClass: "text-red-700" };

    // ── Leaves / profile ─────────────────────────────────────────────────────
    case "leave_applied":
      return { icon: "🌴", label: "Leave applied", colorClass: "text-sky-600" };
    case "leave_approved":
      return { icon: "🌴", label: "Leave approved", colorClass: "text-green-600" };
    case "leave_rejected":
      return { icon: "🌴", label: "Leave rejected", colorClass: "text-red-600" };
    case "leave_modified":
    case "leave_canceled":
      return { icon: "🌴", label: "Leave updated", colorClass: "text-sky-700" };
    case "profile_update_requested":
      return { icon: "👤", label: "Profile change requested", colorClass: "text-slate-600" };
    case "profile_update_reviewed":
      return { icon: "👤", label: "Profile change reviewed", colorClass: "text-slate-700" };

    case "mention":
      return { icon: "@", label: "Mentioned", colorClass: "text-indigo-600" };
    default:
      return { icon: "🔔", label: "Notification", colorClass: "text-gray-500" };
  }
}

/**
 * Derives the navigation URL from entityType + entityId + metadata.
 * Returns null when the notification has no destination, in which case the row
 * renders as a plain (non-clickable) item rather than a button that does nothing.
 *
 * Every entityType the backend emits is listed here. Anything absent from this
 * map is unroutable by design (no frontend surface exists for it yet), not an
 * oversight — add the case when the surface lands.
 *
 * Program-scoped routes take a SLUG, not an id (see SlugResolver), so they read
 * metadata.programSlug which the backend attaches in Notifications.send().
 */
function getNavigationUrl(notification: PdgmsNotification): string | null {
  const { entityType, entityId } = notification;
  const metadata = (notification.metadata ?? {}) as Record<string, unknown>;

  // Explicit override — a producer that already knows its destination (e.g. the
  // ritual reminder cron, which sends the same URL to web push) wins outright.
  const explicit = metadata.actionUrl;
  if (typeof explicit === "string" && explicit.startsWith("/")) {
    return explicit;
  }

  const programSlug =
    typeof metadata.programSlug === "string" ? metadata.programSlug : null;

  switch (entityType) {
    case "ticket":
      // Tickets have a top-level detail route; no program context needed.
      return entityId ? `/ticket/${entityId}` : "/ticket";

    case "compliance":
      // entityId is a programId from the cron but a uid from the escalation
      // path, so it is not safe to deep-link. Land on the compliance board.
      return "/trinethra/compliance";

    case "verification_queue":
      // entityId is the programId here.
      return programSlug
        ? `/mimamsaka/program/${programSlug}/qa-dashboard`
        : "/mimamsaka";

    case "sprint":
      return programSlug
        ? `/mimamsaka/program/${programSlug}/sprint-review`
        : "/mimamsaka";

    case "supScore":
      return "/aavahana/weekly-report";

    case "hcd_initiative":
      // Constraint-spotting doorbell — land on the Improvement board (Innovate tab).
      return entityId ? `/aavahana/hcd?tab=innovate&io=${entityId}` : "/aavahana/hcd";

    case "hcd_insight":
      // Detector notifies the supervisor, whose insight surface is trinethra.
      return "/trinethra/insights";

    case "adoption":
      // kind distinguishes the self-nudge from the supervisor escalation.
      return metadata.kind === "escalate"
        ? "/director/adoption"
        : "/aavahana/daily-plan";

    case "socratic_session":
      return entityId ? `/sd/${entityId}` : "/sd";

    case "communityQuiz":
      return entityId
        ? `/aavahana/community-quiz/${entityId}`
        : "/aavahana/community-quiz";

    case "crm_escalation_case":
      // The recipient is the agent the case was routed to.
      return "/crm/outreach/escalations/me";

    // identity_cadence and ritual_reminder without an actionUrl have no
    // dedicated surface. Render them as read-only rows.
    default:
      return null;
  }
}

/** Formats an ISO datetime string as a relative label (e.g. "2h ago", "3d ago"). */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function PdgmsNotificationItem({ notification, onClose }: PdgmsNotificationItemProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isUnread = notification.readAt === null;
  const { icon, label, colorClass } = getTypePresentation(notification.type);
  const navUrl = getNavigationUrl(notification);

  const handleClick = async () => {
    // Optimistic read — update the unread count cache before the API responds.
    if (isUnread) {
      queryClient.setQueryData(
        ["shared", "pdgms-notifications", "unread-count"],
        (old: { count: number } | undefined) =>
          old ? { count: Math.max(0, old.count - 1) } : old
      );

      // Fire-and-forget the mark-read API call — failure is non-critical.
      NotificationService.markPdgmsRead(notification.id)
        .then((result) => {
          if (isError(result)) {
            logger.warn("[PdgmsNotificationItem] Failed to mark as read", result);
          }
        })
        .catch((err) => logger.warn("[PdgmsNotificationItem] mark-read error", err));
    }

    if (navUrl) {
      onClose();
      router.push(navUrl);
    }
  };

  // Only advertise interactivity when there is somewhere to go. A row that
  // looks like a button but navigates nowhere reads as a broken notification.
  const isNavigable = navUrl !== null;

  return (
    <div
      {...(isNavigable
        ? {
            role: "button",
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            },
          }
        : {})}
      onClick={ignoreTextSelection(handleClick)}
      className={`flex items-start gap-3 border-b border-gray-100 px-4 py-3 transition-colors group ${
        isNavigable ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
      } ${isUnread ? "bg-blue-50/40" : ""}`}
    >
      {/* Event type icon */}
      <span className="mt-0.5 flex-shrink-0 text-lg leading-none" aria-hidden>
        {icon}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Type badge + time */}
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <span className={`text-xs font-medium ${colorClass}`}>{label}</span>
          <span className="flex-shrink-0 text-xs text-gray-400">
            {relativeTime(notification.createdAt)}
          </span>
        </div>

        {/* Title */}
        <p
          className={`text-sm leading-snug text-gray-900 ${
            isUnread ? "font-semibold" : "font-normal"
          }`}
        >
          {notification.title}
        </p>

        {/* Body (if present) */}
        {notification.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
            {notification.body}
          </p>
        )}
      </div>

      {/* Unread dot */}
      {isUnread && (
        <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
      )}
    </div>
  );
}
