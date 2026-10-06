// src/lib/services/notification.service.ts
import { api, ApiResult } from "@/lib/api/client";
import {
  RegisterPushSubscriptionRequest,
  UnregisterPushSubscriptionRequest,
  NotificationHistoryParams,
  NotificationHistoryResponse,
  PdgmsNotificationsResponse,
  NotificationPreferences,
  NotificationPreferencesPayload,
  NotificationRule,
  CreateNotificationRulePayload,
  UpdateNotificationRulePayload,
} from "@/types";

const BASE = "/v3/pdgms/infra/notifications";

/**
 * ============================================
 * NOTIFICATION SERVICE
 * ============================================
 * Handles API calls for push subscriptions and notification management
 */

export class NotificationService {
  /**
   * Register browser push notification subscription
   *
   * @param data - Push subscription data including endpoint and keys
   * @returns Success confirmation
   * @throws {ApiError} if request fails
   *
   * @example
   * const subscription = await registration.pushManager.subscribe({...});
   * const result = await NotificationService.registerPushSubscription({
   *   uid: 123,
   *   subscription: {
   *     endpoint: subscription.endpoint,
   *     keys: {
   *       p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
   *       auth: arrayBufferToBase64(subscription.getKey('auth'))
   *     }
   *   }
   * });
   */
  static async registerPushSubscription(
    data: RegisterPushSubscriptionRequest
  ): Promise<ApiResult<{ success: boolean; message: string }>> {
    return api.post<{ success: boolean; message: string }>(
      "/v3/notifications/push/subscribe",
      data,
      { throw: true }
    );
  }

  /**
   * Unregister browser push notification subscription
   *
   * @param data - User ID and subscription endpoint to remove
   * @returns Success confirmation
   * @throws {ApiError} if request fails
   *
   * @example
   * const result = await NotificationService.unregisterPushSubscription({
   *   uid: 123,
   *   endpoint: 'https://fcm.googleapis.com/...'
   * });
   */
  static async unregisterPushSubscription(
    data: UnregisterPushSubscriptionRequest
  ): Promise<ApiResult<{ success: boolean; message: string }>> {
    return api.post<{ success: boolean; message: string }>(
      "/v3/notifications/push/unsubscribe",
      data,
      { throw: true }
    );
  }

  /**
   * Get notification history for the current user
   *
   * @param params - Pagination and filter parameters
   * @returns List of notifications with pagination info
   *
   * @example
   * const result = await NotificationService.getHistory({
   *   page: 1,
   *   limit: 20,
   *   unreadOnly: true
   * });
   * if (!isError(result)) {
   *   console.log(result.notifications);
   * }
   */
  static async getHistory(
    params?: NotificationHistoryParams
  ): Promise<ApiResult<NotificationHistoryResponse>> {
    // Convert NotificationHistoryParams to PaginationParams
    const paginationParams = params ? {
      page: params.page,
      limit: params.limit,
      unreadOnly: params.unreadOnly,
    } : undefined;

    return api.get<NotificationHistoryResponse>("/v3/notifications/history", paginationParams);
  }

  /**
   * Mark a notification as read
   *
   * @param notificationId - ID of the notification to mark as read
   * @returns Success confirmation
   *
   * @example
   * const result = await NotificationService.markAsRead('notif-123');
   */
  static async markAsRead(
    notificationId: string
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.post<{ success: boolean }>(`/v3/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   *
   * @returns Success confirmation
   *
   * @example
   * const result = await NotificationService.markAllAsRead();
   */
  static async markAllAsRead(): Promise<ApiResult<{ success: boolean }>> {
    return api.post<{ success: boolean }>("/v3/notifications/read-all");
  }

  /**
   * Delete a notification
   *
   * @param notificationId - ID of the notification to delete
   * @returns Success confirmation
   *
   * @example
   * const result = await NotificationService.deleteNotification('notif-123');
   */
  static async deleteNotification(
    notificationId: string
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>(`/v3/notifications/${notificationId}`);
  }

  /**
   * Clear all notifications
   *
   * @returns Success confirmation
   *
   * @example
   * const result = await NotificationService.clearAll();
   */
  static async clearAll(): Promise<ApiResult<{ success: boolean }>> {
    return api.delete<{ success: boolean }>("/v3/notifications/clear-all");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PDGMS BUSINESS NOTIFICATIONS
  // Backend-persisted events from /api/v3/pdgms/notifications.
  // These are distinct from the generic toast notification system above.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the paginated PDGMS notification inbox for the current user.
   * Sorted newest-first. Includes both read and unread items.
   */
  static async getPdgmsInbox(
    page = 1,
    perPage = 20
  ): Promise<ApiResult<PdgmsNotificationsResponse>> {
    return api.get<PdgmsNotificationsResponse>(BASE, { page, perPage });
  }

  /**
   * Get the count of unread PDGMS notifications for the badge indicator.
   * Polled on a short interval by the bell component.
   */
  static async getPdgmsUnreadCount(): Promise<ApiResult<{ count: number }>> {
    return api.get<{ count: number }>(`${BASE}/unread-count`);
  }

  /**
   * Mark a single PDGMS notification as read.
   * Sets readAt to the current server timestamp.
   */
  static async markPdgmsRead(
    id: number
  ): Promise<ApiResult<{ success: boolean }>> {
    return api.patch<{ success: boolean }>(`${BASE}/${id}/read`);
  }

  /**
   * Mark all PDGMS notifications as read in a single call.
   * Scoped to the current user + org via session.
   */
  static async markAllPdgmsRead(): Promise<ApiResult<{ success: boolean }>> {
    return api.patch<{ success: boolean }>(`${BASE}/mark-all-read`);
  }

  // ─── Preferences ───────────────────────────────────────────────────────────

  /**
   * Get the current user's notification delivery preferences.
   * Includes channel toggles, muted event types, and quiet hours.
   */
  static async getPreferences(): Promise<ApiResult<NotificationPreferences>> {
    return api.get<NotificationPreferences>(`${BASE}/preferences`);
  }

  /**
   * Update the current user's notification delivery preferences.
   * Replaces the full preferences record — send all fields even if unchanged.
   */
  static async updatePreferences(
    payload: NotificationPreferencesPayload
  ): Promise<ApiResult<NotificationPreferences>> {
    return api.put<NotificationPreferences>(`${BASE}/preferences`, payload);
  }

  // ─── Notification Rules (per-program, TPM/admin only) ─────────────────────

  /**
   * List all notification routing rules configured for a program.
   * Used in program settings pages — typically only visible to TPMs.
   */
  static async getNotificationRules(
    programId: number
  ): Promise<ApiResult<NotificationRule[]>> {
    return api.get<NotificationRule[]>(
      `/v3/pdgms/infra/programs/${programId}/notification-rules`
    );
  }

  /**
   * Create a new notification routing rule for a program.
   * Returns the created rule with generated id, timestamps, and createdBy set.
   */
  static async createNotificationRule(
    programId: number,
    payload: CreateNotificationRulePayload
  ): Promise<ApiResult<NotificationRule>> {
    return api.post<NotificationRule>(
      `/v3/pdgms/infra/programs/${programId}/notification-rules`,
      payload
    );
  }

  /**
   * Update an existing notification routing rule (partial update).
   * Only provided fields are changed. Returns the full updated rule.
   */
  static async updateNotificationRule(
    programId: number,
    ruleId: number,
    payload: UpdateNotificationRulePayload
  ): Promise<ApiResult<NotificationRule>> {
    return api.put<NotificationRule>(
      `/v3/pdgms/infra/programs/${programId}/notification-rules/${ruleId}`,
      payload
    );
  }
}
