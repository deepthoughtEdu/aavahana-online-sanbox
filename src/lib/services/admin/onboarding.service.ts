import { api } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/client";
import type {
  OnboardingRecord, OnboardingStatus, OnboardingStepKey,
  CompleteStepPayload, NextStepResponse, OnboardingListItem,
  CredentialsResponse, EmploymentDetailsResponse,
  ConfirmEmploymentDetailsPayload, VerificationDocStatus,
  InductionStatus,
} from "@/types/admin";

const BASE = "/v3/pdgms";

export class OnboardingService {
  static async start(userId: string): Promise<ApiResult<OnboardingRecord>> {
    return api.post<OnboardingRecord>(`${BASE}/people/onboarding/${userId}/start`, {});
  }
  static async get(userId: string): Promise<ApiResult<OnboardingRecord>> {
    return api.get<OnboardingRecord>(`${BASE}/people/onboarding/${userId}`);
  }
  static async list(params?: { status?: OnboardingStatus; page?: number; perPage?: number }): Promise<ApiResult<{ items: OnboardingListItem[]; total: number; page: number; perPage: number }>> {
    return api.get<{ items: OnboardingListItem[]; total: number; page: number; perPage: number }>(`${BASE}/people/onboarding`, params);
  }
  static async completeStep(userId: string, stepKey: OnboardingStepKey, payload: CompleteStepPayload): Promise<ApiResult<OnboardingRecord>> {
    return api.patch<OnboardingRecord>(`${BASE}/people/onboarding/${userId}/steps/${stepKey}`, payload);
  }
  static async getNextStep(userId: string): Promise<ApiResult<NextStepResponse>> {
    return api.get<NextStepResponse>(`${BASE}/people/onboarding/${userId}/next-step`);
  }
  static async markOnboarded(userId: string): Promise<ApiResult<{ userType: string; landingRoute: string }>> {
    return api.patch<{ userType: string; landingRoute: string }>(`${BASE}/admin/users/${userId}/mark-onboarded`, {});
  }
  static async getSlackStatus(): Promise<ApiResult<{ slackJoined: boolean; slackJoinedAt: string | null }>> {
    return api.get<{ slackJoined: boolean; slackJoinedAt: string | null }>(`${BASE}/people/onboarding/slack-status`);
  }
  static async confirmSlack(): Promise<ApiResult<{ slackJoined: boolean; slackJoinedAt: number }>> {
    return api.patch<{ slackJoined: boolean; slackJoinedAt: number }>(`${BASE}/people/onboarding/confirm-slack`, {});
  }
  static async reinitiateSlack(userId: string): Promise<ApiResult<{ slackJoined: boolean; emailSent: boolean }>> {
    return api.patch<{ slackJoined: boolean; emailSent: boolean }>(`${BASE}/admin/users/${userId}/reinitiate-slack`, {});
  }

  static async getCredentials(): Promise<ApiResult<CredentialsResponse>> {
    return api.get<CredentialsResponse>(`${BASE}/people/onboarding/credentials`);
  }

  static async getEmploymentDetails(): Promise<ApiResult<EmploymentDetailsResponse>> {
    return api.get<EmploymentDetailsResponse>(`${BASE}/people/onboarding/employment-details`);
  }

  static async confirmEmploymentDetails(data: ConfirmEmploymentDetailsPayload): Promise<ApiResult<{ confirmed: boolean; confirmedAt: number }>> {
    return api.patch<{ confirmed: boolean; confirmedAt: number }>(`${BASE}/people/onboarding/confirm-employment-details`, data);
  }

  static async getVerificationDocStatus(): Promise<ApiResult<VerificationDocStatus>> {
    return api.get<VerificationDocStatus>(`${BASE}/people/onboarding/verification-doc-status`);
  }

  static async uploadFellowshipAgreement(file: File): Promise<ApiResult<{ uploaded: boolean; documentId: number; cloudinaryUrl: null; downloadUrl: string }>> {
    const form = new FormData();
    form.append("files[]", file, file.name);
    return api.post<{ uploaded: boolean; documentId: number; cloudinaryUrl: null; downloadUrl: string }>(`${BASE}/people/onboarding/upload-fellowship-agreement`, form);
  }

  static async downloadFellowshipAgreement(downloadUrl: string): Promise<string> {
    const apiPath = downloadUrl.startsWith("/api/") ? downloadUrl.slice(4) : downloadUrl;
    return api.download(apiPath, "fellowship-agreement");
  }

  static async getInductionStatus(): Promise<ApiResult<InductionStatus>> {
    return api.get<InductionStatus>(`${BASE}/people/onboarding/induction-status`);
  }

  static async acknowledgeInduction(): Promise<ApiResult<InductionStatus>> {
    return api.patch<InductionStatus>(`${BASE}/people/onboarding/acknowledge-induction`, {});
  }

  static async reinitiateInduction(userId: string): Promise<ApiResult<{ acknowledged: boolean }>> {
    return api.patch<{ acknowledged: boolean }>(`${BASE}/admin/users/${userId}/reinitiate-induction`, {});
  }

  static async reinitiateEmploymentDetails(userId: string): Promise<ApiResult<{ confirmed: boolean; emailSent: boolean }>> {
    return api.patch<{ confirmed: boolean; emailSent: boolean }>(`${BASE}/admin/users/${userId}/reinitiate-employment-details`, {});
  }

  static async reinitiateVerificationDoc(userId: string): Promise<ApiResult<{ uploaded: boolean; emailSent: boolean }>> {
    return api.patch<{ uploaded: boolean; emailSent: boolean }>(`${BASE}/admin/users/${userId}/reinitiate-verification-doc`, {});
  }
}
