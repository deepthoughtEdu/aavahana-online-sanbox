// src/types/notification.types.ts

/**
 * ============================================
 * GENERIC NOTIFICATION TYPES
 * ============================================
 */

export enum NotificationType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

// ─────────────────────────────────────────────────────────────────────────────
// PDGMS BUSINESS NOTIFICATION TYPES
// These map to backend-persisted events delivered via /api/v3/pdgms/notifications.
// Durable and paginated.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The business event types that the PDGMS backend can fire.
 *
 * Mirrors VALID_NOTIFICATION_TYPES in the backend's src/pdgms/infra/notifications.js,
 * which is the canonical list. The backend column is a String (it was a Postgres
 * enum until 2026-07-29, and the enum had drifted so far behind the code that 11
 * of 18 dispatched types were silently rejected at write time). Adding an event
 * type means adding it in both places.
 *
 * growth_constraint_* are the constraint-spotting doorbell events (W2.2):
 * state-change + link only, no analysis prose in the body.
 */
export type PdgmsNotificationType =
  // Legacy enum values — older rows carry these.
  | "report_due"
  | "constraint_assigned"
  | "deviation_fired"
  | "ticket_status_changed"
  | "non_compliance"
  | "sprint_activated"
  | "mention"
  | "identity_completed"
  // Tickets
  | "ticket_assigned"
  | "constraint_ticket_assigned"
  // Reporting / compliance
  | "report_not_submitted"
  | "recurring_noncompliance"
  | "deadline_approaching"
  | "qa_aging"
  | "scoring_due"
  // Sprints / deviations
  | "deviation_trigger_fired"
  // Identity cadence
  | "identity_retake_due"
  | "identity_mentee_overdue"
  | "identity_report_overdue"
  // Growth / HCD
  | "growth_constraint_spotted"
  | "growth_constraint_evidence"
  | "hcd_insight_alert"
  // Socratic
  | "socratic_review_assigned"
  // Community quiz
  | "community_quiz_status"
  | "community_quiz_participant_joined"
  // CRM
  | "crm_escalation"
  | "crm_deviation_yellow"
  | "crm_deviation_orange"
  | "crm_deviation_red"
  // BYOK keys — a shared key nearing or past its limit. Background work does not
  // switch provider on its own (D-5); it stops and the key's owner is told.
  | "byok_key_warning"
  | "byok_key_exhausted"
  // Leaves / profile
  | "leave_applied"
  | "leave_approved"
  | "leave_rejected"
  | "leave_modified"
  | "leave_canceled"
  | "profile_update_requested"
  | "profile_update_reviewed";

/**
 * A single PDGMS notification as returned by GET /api/v3/pdgms/notifications.
 * readAt: null means the notification has not been read yet.
 */
export interface PdgmsNotification {
  id: number;
  orgId: string;
  type: PdgmsNotificationType;
  recipientId: string;
  senderId: string | null;
  programId: number | null;
  title: string;
  body: string | null;
  /** "ticket" | "compliance" | "verification_queue" | "supScore" */
  entityType: string | null;
  entityId: string | null;
  channels: string[] | null;
  metadata: Record<string, unknown> | null;
  /** ISO datetime — null means unread. */
  readAt: string | null;
  createdAt: string;
}

/**
 * Paginated response wrapper for the PDGMS notification inbox.
 */
export interface PdgmsNotificationsResponse {
  items: PdgmsNotification[];
  total: number;
  page: number;
  perPage: number;
}

/**
 * User-level notification delivery preferences stored per org.
 * Returned by GET /api/v3/pdgms/notifications/preferences.
 */
export interface NotificationPreferences {
  orgId: string;
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  /** Event types the user has silenced — no notifications sent for these. */
  mutedEventTypes: PdgmsNotificationType[];
  /** "HH:MM" 24-hour format. null = no quiet hours configured. */
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

/**
 * Payload for PUT /api/v3/pdgms/notifications/preferences.
 * Omits orgId/userId — those come from the session.
 */
export interface NotificationPreferencesPayload {
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  mutedEventTypes: PdgmsNotificationType[];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

/**
 * A per-program notification routing rule configured by TPM/admin.
 * Controls which events trigger notifications, on which channels, to whom.
 */
export interface NotificationRule {
  id: number;
  orgId: string;
  programId: number | null;
  /** One of PdgmsNotificationType. */
  eventType: string;
  /** e.g. ["in_app", "email"] */
  channels: string[];
  /** e.g. ["role:l3_tpm", "42"] — role specifiers or user IDs. */
  recipients: string[];
  /** "immediate" or a cron expression. */
  schedule: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for POST /api/v3/pdgms/programs/:programId/notification-rules.
 */
export interface CreateNotificationRulePayload {
  eventType: string;
  channels: string[];
  recipients: string[];
  schedule: string;
  isActive: boolean;
}

/**
 * Payload for PUT /api/v3/pdgms/programs/:programId/notification-rules/:ruleId.
 * All fields optional — only provided fields are updated.
 */
export interface UpdateNotificationRulePayload {
  eventType?: string;
  channels?: string[];
  recipients?: string[];
  schedule?: string;
  isActive?: boolean;
}

export interface Notification {
  id: string;
  uid: number; // NodeBB user ID
  title: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

/**
 * ============================================
 * CONNECTION STATES
 * ============================================
 */

export enum ConnectionState {
  INITIALIZED = "initialized",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  SUSPENDED = "suspended",
  FAILED = "failed",
  CLOSED = "closed",
}

/**
 * ============================================
 * WEB PUSH SUBSCRIPTION
 * ============================================
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface RegisterPushSubscriptionRequest {
  uid: number;
  subscription: PushSubscriptionData;
}

export interface UnregisterPushSubscriptionRequest {
  uid: number;
  endpoint: string;
}

/**
 * ============================================
 * NOTIFICATION STATE
 * ============================================
 */

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  connectionState: ConnectionState;
  error: string | null;
  pushPermission: NotificationPermission;
  pushSubscribed: boolean;
}

/**
 * ============================================
 * NOTIFICATION HISTORY
 * ============================================
 */

export interface NotificationHistoryParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface NotificationHistoryResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
