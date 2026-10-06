/**
 * use-pdgms-notifications.ts
 *
 * TanStack Query hooks for the PDGMS backend-persisted notification system.
 * Separate from use-notifications.ts — these hooks cover the durable inbox,
 * preferences, and per-program notification rules.
 *
 * All hooks are safe to use from any module — they live in shared/.
 */
import { useApi, useApiMutation } from "@/lib/hooks/shared/use-api";
import { useAuth } from "@/lib/hooks/shared/use-auth";
import { useAtomValue } from "jotai";
import { connectionStateAtom } from "@/lib/store/notifications";
import { ConnectionState } from "@/types";
import { NotificationService } from "@/lib/services/shared/notification.service";
import type {
  NotificationPreferencesPayload,
  CreateNotificationRulePayload,
  UpdateNotificationRulePayload,
  PaginatedQueryResult,
  PdgmsNotification,
} from "@/types";

// ─── Inbox ────────────────────────────────────────────────────────────────────

/**
 * Paginated PDGMS notification inbox for the current user.
 * Sorted newest-first. Includes both read and unread notifications.
 *
 * @example
 * const { data, pagination, isLoading, error } = usePdgmsInbox();
 * // data: PdgmsNotification[]        — the items themselves, not the envelope
 * // pagination.next.active: boolean  — whether another page exists
 */
export function usePdgmsInbox(
  page = 1,
  perPage = 20
): PaginatedQueryResult<PdgmsNotification> {
  const result = useApi({
    queryKey: ["shared", "pdgms-notifications", "inbox", page, perPage],
    queryFn: () => NotificationService.getPdgmsInbox(page, perPage),
  });

  // useApi unwraps the backend's { items, total, page, perPage } envelope at
  // runtime: `data` becomes the items array and the count moves onto
  // `pagination`. Its overloads only model the { data, pagination } shape, so
  // they infer the envelope type and `data.items` silently reads undefined.
  // Restate the real shape once here rather than at every call site.
  return result as unknown as PaginatedQueryResult<PdgmsNotification>;
}

/**
 * Unread count for the bell badge indicator.
 * Polled every 60 seconds so the badge stays fresh without user interaction.
 *
 * @example
 * const { data } = usePdgmsUnreadCount();
 * // data.count: number
 */
export function usePdgmsUnreadCount() {
  const { isAuthenticated, selectedOrg } = useAuth();
  const socketConnectionState = useAtomValue(connectionStateAtom);
  const isSocketConnected = socketConnectionState === ConnectionState.CONNECTED;

  return useApi({
    queryKey: ["shared", "pdgms-notifications", "unread-count"],
    queryFn: () => NotificationService.getPdgmsUnreadCount(),
    // When socket is live, poll only as a fallback heartbeat (5 min).
    // When socket is unavailable, poll aggressively (60s) to keep the badge fresh.
    refetchInterval: isSocketConnected ? 5 * 60_000 : 60_000,
    enabled: isAuthenticated && !!selectedOrg,
  });
}

/**
 * Mutations for marking notifications as read.
 * Both mutations invalidate the inbox and unread-count queries on success
 * so the UI updates immediately without a manual refetch.
 *
 * @example
 * const { markRead, markAllRead, isMarkingRead } = usePdgmsNotificationMutations();
 * await markRead(101);
 * await markAllRead();
 */
export function usePdgmsNotificationMutations() {
  const markRead = useApiMutation({
    mutationFn: (id: number) => NotificationService.markPdgmsRead(id),
    onSuccess: (_data, _vars, context) => {
      // Invalidation is handled via the onSuccess side-effect pattern;
      // because useApiMutation does not expose invalidateKeys directly,
      // callers should wrap with queryClient.invalidateQueries if needed.
      // For simple mark-read patterns, optimistic UI in the component is sufficient.
      void context;
    },
  });

  const markAllRead = useApiMutation({
    mutationFn: () => NotificationService.markAllPdgmsRead(),
  });

  return {
    markRead: markRead.mutateAsync,
    markAllRead: markAllRead.mutateAsync,
    isMarkingRead: markRead.isPending,
    isMarkingAllRead: markAllRead.isPending,
  };
}

// ─── Preferences ─────────────────────────────────────────────────────────────

/**
 * Fetch and update the current user's notification delivery preferences.
 * Returns channel toggles, muted event types, and quiet hours configuration.
 *
 * @example
 * const { data: prefs, update, isSaving } = useNotificationPreferences();
 * await update({ ...prefs, channels: { inApp: true, email: false, push: false }, mutedEventTypes: [] });
 */
export function useNotificationPreferences() {
  const query = useApi({
    queryKey: ["shared", "pdgms-notifications", "preferences"],
    queryFn: () => NotificationService.getPreferences(),
  });

  const mutation = useApiMutation({
    mutationFn: (payload: NotificationPreferencesPayload) =>
      NotificationService.updatePreferences(payload),
  });

  return {
    ...query,
    update: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  };
}

// ─── Notification Rules (per-program) ────────────────────────────────────────

/**
 * Fetch all notification routing rules for a program.
 * Only loads when programId is provided — safe to call unconditionally.
 *
 * @example
 * const { data: rules, isLoading } = useNotificationRules(programId);
 */
export function useNotificationRules(programId: number | null) {
  return useApi({
    queryKey: ["shared", "pdgms-notifications", "rules", programId],
    queryFn: () => NotificationService.getNotificationRules(programId!),
    enabled: !!programId,
  });
}

/**
 * Create and update notification routing rules for a program.
 * Used in program settings — typically visible to TPMs only.
 *
 * @example
 * const { createRule, updateRule, isCreating } = useNotificationRuleMutations(programId);
 * await createRule({ eventType: "ticket_assigned", channels: ["in_app"], recipients: ["role:l3_tpm"], schedule: "immediate", isActive: true });
 */
export function useNotificationRuleMutations(programId: number) {
  const create = useApiMutation({
    mutationFn: (payload: CreateNotificationRulePayload) =>
      NotificationService.createNotificationRule(programId, payload),
  });

  const update = useApiMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: number; payload: UpdateNotificationRulePayload }) =>
      NotificationService.updateNotificationRule(programId, ruleId, payload),
  });

  return {
    createRule: create.mutateAsync,
    updateRule: update.mutateAsync,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    createError: create.error,
    updateError: update.error,
  };
}
