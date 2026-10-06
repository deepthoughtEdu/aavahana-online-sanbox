export interface AuthConfig {
  registrationEnabled: boolean;
  requireEmailConfirmation: boolean;
  allowLocalLogin: boolean;
  allowGoogleLogin: boolean;
  minimumPasswordLength: number;
  minimumPasswordStrength: number;
  minimumUsernameLength: number;
  maximumUsernameLength: number;
  allowedLoginAttempts: number;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  strength: {
    weak: number;
    medium: number;
    strong: number;
  };
}

export interface UsernameCheckResponse {
  available: boolean;
  message?: string;
}

export interface EmailCheckResponse {
  available: boolean;
  message?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  uid: number;
  username: string;
  email: string;
  message: string;
}

export interface VerifyEmailRequest {
  code: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  uid: number;
  username: string;
  email: string;
  picture?: string;
  fullname?: string;
  userType?: string;
  landingRoute?: string;
  /** CRM v2 phase 1: on the rebuilt BD surface under /beta/crm. */
  crmBeta?: boolean;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ValidateResetCodeRequest {
  code: string;
}

export interface ValidateResetCodeResponse {
  valid: boolean;
  message?: string;
}

export interface ResetPasswordRequest {
  code: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface GoogleCallbackParams {
  code: string;
  scope?: string;
  authuser?: string;
  prompt?: string;
}

export interface GoogleVerifyResponse {
  status: string;
  user: {
    uid: number;
    username: string;
    email: string;
    picture?: string;
    fullname?: string;
  };
}

export interface UnlinkGoogleResponse {
  success: boolean;
  message: string;
}
