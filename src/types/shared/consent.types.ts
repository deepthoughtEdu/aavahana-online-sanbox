// DPDP/GDPR consent — frontend DTOs. Mirrors the PDGMS-Backend
// /api/v3/pdgms/privacy/consent serializers (policies / status / give / withdraw).

export type ConsentPurposeKey =
  | "SERVICE_DELIVERY"
  | "AI_COACHING"
  | "PLATFORM_IMPROVEMENT"
  | "PERFORMANCE_SCORING"
  | "PAYROLL_STATUTORY"
  | "EXTERNAL_PROSPECT";

// GET /policies → serializePolicy
export interface ConsentPolicy {
  purposeKey: ConsentPurposeKey;
  version: string;
  noticeText: string;
}

// GET /status → serializeConsentStatus
export interface ConsentStatusEntry {
  purposeKey: ConsentPurposeKey;
  granted: boolean;
}

// POST /give and /withdraw return the written ConsentRecord row.
export interface ConsentRecordResponse {
  id: number;
  purposeKey: ConsentPurposeKey | null;
  policyVersion: string | null;
  granted: boolean;
  consentedAt: string;
  withdrawnAt: string | null;
}

export interface GiveConsentPayload {
  purposeKey: ConsentPurposeKey;
  method?: string;
  source?: string;
}

export interface WithdrawConsentPayload {
  purposeKey: ConsentPurposeKey;
}
