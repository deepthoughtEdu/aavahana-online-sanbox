import type { ByokKeyHeadroom } from "@/types/shared/byok-preflight.types";
// ─── Provider / Ownership Enums ──────────────────────────────────────────────

// Single source of truth is the shared BYOK catalog. This union used to be a
// second hardcoded copy, which meant adding a provider in one place and having
// the admin screen silently disagree with it.
import type { ByokProvider } from "@/lib/store/shared/byok.store";

export type { ByokProvider };

/**
 * A key plus what it has spent today and what that leaves, in the provider's
 * own unit. `headroom.provenance` says whether the figure came from the
 * provider, from our own count, or from nowhere.
 */
export interface ByokKeyWithHeadroom extends ByokApiKey {
  dailyTokenLimit: number | null;
  dailyRequestLimit: number | null;
  monthlyTokenLimit: number | null;
  limitsSource: string | null;
  headroom: ByokKeyHeadroom;
}

export interface SetByokKeyLimitsPayload {
  dailyTokenLimit?: number | null;
  dailyRequestLimit?: number | null;
  monthlyTokenLimit?: number | null;
}
export type ByokKeyOwnership = "individual" | "group" | "org";
export type ByokRateLimitScope = "per_user" | "per_org";

// ─── API Key ─────────────────────────────────────────────────────────────────

export interface ByokApiKey {
  id: number;
  orgId: string;
  label: string;
  provider: ByokProvider;
  model?: string | null;
  ownershipType: ByokKeyOwnership;
  ownerUserId?: string | null;
  ownerGroupId?: number | null;
  keyFingerprint: string;
  isActive: boolean;
  allowEmployeeUse: boolean;
  lastUsedAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreByokKeyPayload {
  label: string;
  provider: ByokProvider;
  model?: string;
  ownershipType: ByokKeyOwnership;
  ownerGroupId?: number;
  allowEmployeeUse?: boolean;
  apiKey: string;
}

// ─── Group ───────────────────────────────────────────────────────────────────

export interface ByokGroup {
  id: number;
  orgId: string;
  name: string;
  description?: string | null;
  createdBy: string;
  isActive: boolean;
  memberCount?: number;
  members?: ByokGroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface ByokGroupMember {
  id: number;
  groupId: number;
  userId: string;
  role: "admin" | "member";
  addedBy: string;
  addedAt: string;
  username?: string;
}

export interface CreateByokGroupPayload {
  name: string;
  description?: string;
}

export interface UpdateByokGroupPayload {
  name?: string;
  description?: string;
}

export interface AddGroupMemberPayload {
  userId: string;
  role?: "admin" | "member";
}

// ─── Rate Limits ─────────────────────────────────────────────────────────────

export interface ByokLimits {
  perMinute: number;
  perHour: number;
  perDay: number;
  perMonth: number;
  source?: "default" | "custom" | "temporary";
  expiresAt?: string | null;
}

export interface ByokTierUsage {
  user: { current: number; limit: number; remaining: number };
  org: { current: number; limit: number; remaining: number };
}

export interface ByokRateLimitStatus {
  userLimits: ByokLimits;
  orgLimits: ByokLimits;
  tiers: Record<string, ByokTierUsage>;
}

export interface ByokRateLimitConfig {
  userLimits: ByokLimits;
  orgLimits: ByokLimits;
}

export interface RequestLimitChangePayload {
  scope: ByokRateLimitScope;
  targetUserId?: string;
  newLimits: { perMinute: number; perHour: number; perDay: number; perMonth: number };
}

export interface RequestTempBoostPayload extends RequestLimitChangePayload {
  durationHours?: number;
}

export interface OtpSentResponse {
  otpSent: boolean;
  maskedEmail: string;
  otpId: number;
}

export interface OtpConfirmResponse {
  success: boolean;
  effectiveLimits: ByokLimits;
  durationHours?: number;
}

// ─── Audit / Usage ───────────────────────────────────────────────────────────

export interface ByokCallLog {
  id: number;
  userId: string;
  service: string;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  estimatedCostUsd?: number | null;
  estimatedCostInr?: number | null;
  latencyMs: number;
  success: boolean;
  error?: string | null;
  createdAt: string;
}

export interface ByokUsageEntry {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  creditsUsed: number;
  callCount: number;
}

export interface ByokUsageSummary {
  userUsage: ByokUsageEntry[];
  orgUsage: ByokUsageEntry[];
  monthId: string;
}

export interface ByokCallLogList {
  items: ByokCallLog[];
  total: number;
  page: number;
  perPage: number;
}

// ─── Session Lock ───────────────────────────────────────────────────────────

export interface ByokSessionLockStatus {
  enabled: boolean;
  unlocked: boolean;
  ttlHours: number;
  expiresInSeconds?: number | null;
}

export interface ByokSessionLockEnableResult {
  enabled: boolean;
  keysReEncrypted: number;
}

export interface ByokSessionLockDisableResult {
  enabled: boolean;
  keysReEncrypted: number;
}

export interface ByokSessionLockUnlockResult {
  unlocked: boolean;
  expiresInSeconds: number;
}
