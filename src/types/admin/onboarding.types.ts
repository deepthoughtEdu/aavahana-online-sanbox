export type OnboardingStatus = "not_started" | "in_progress" | "completed";

export type OnboardingStepKey =
  | "profile_setup"
  | "org_introduction"
  | "career_plan_setup"
  | "role_briefing"
  | "tool_access"
  | "first_plan"
  | "first_report"
  | "enabler_enrollment"
  | "buddy_assignment"
  | "first_reflection"
  | "supervisor_checkin"
  | "onboarding_complete";

export interface OnboardingStep {
  completed: boolean;
  completedAt: string | null;
  data: Record<string, unknown>;
}

export interface OnboardingProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface OnboardingUserInfo {
  username: string;
  email: string;
  fullname: string;
  picture: string | null;
}

export interface OnboardingGates {
  slackJoined: boolean;
  employmentConfirmed: boolean;
  inductionAcknowledged: boolean;
  verificationDocUploaded: boolean;
}

export interface InductionStatus {
  acknowledged: boolean;
  acknowledgedAt: number | null;
}

export interface OnboardingRecord {
  id: number;
  orgId: string;
  userId: string;
  eid: number;
  status: OnboardingStatus;
  steps: Record<OnboardingStepKey, OnboardingStep>;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  progress: OnboardingProgress;
  user?: OnboardingUserInfo;
  gates?: OnboardingGates;
}

export type OnboardingListItem = OnboardingRecord;

export interface CompleteStepPayload {
  data: Record<string, unknown>;
}

export interface NextStepResponse {
  nextStep: OnboardingStepKey | null;
  stepIndex?: number;
  totalSteps?: number;
  completedSteps?: number;
  message?: string;
}

export interface CredentialsResponse {
  dtEmail: string | null;
  dtPassword: string | null;
  webmailUrl: string;
}

export interface EmploymentDetailsResponse {
  confirmed: boolean;
  confirmedAt: number | null;
  prefilled: {
    role: string | null;
    workingHours: string | null;
    basePay: string | null;
    ldBonus: string | null;
    performancePay: string | null;
    workingDays: string | null;
    simulationPeriodStartDate: string | null;
    joiningDate: string | null;
  };
  userEntered: {
    accountNumber: string | null;
    ifsc: string | null;
    upi: string | null;
  };
}

export interface ConfirmEmploymentDetailsPayload {
  accountNumber: string;
  ifsc: string;
  upi: string;
  role?: string;
  workingHours?: string;
  basePay?: string;
  ldBonus?: string;
  performancePay?: string;
  workingDays?: string;
  simulationPeriodStartDate?: string;
  joiningDate?: string;
}

export interface VerificationDocStatus {
  uploaded: boolean;
  uploadedAt: number | null;
  deadline: number | null;
  documentId: number | null;
  cloudinaryUrl: string | null;
  downloadUrl: string | null;
  isOverdue: boolean;
}
