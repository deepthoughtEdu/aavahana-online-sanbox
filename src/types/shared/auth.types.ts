// ============================================================================
// AUTH STATUS TYPES
// ============================================================================

export type AuthStatus = "idle" | "loading" | "success" | "error";

export type StatusType = "verifying" | "success" | "error";

// ============================================================================
// AUTH FORM PROPS (Component Props - No callbacks needed anymore)
// ============================================================================

export interface AuthLayoutProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
  title?: string;
  message?: string;
  formTitle?: string;
  formIcon?: React.ReactNode;
  formDescription?: string;
  hideHeader?: boolean;
}

export interface StatusDisplayProps {
  status: StatusType;
  title?: string;
  message?: string;
  errorMessage?: string;
  loadingText?: string;
  successText?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES (from Postman collection)
// ============================================================================

/**
 * Public Configuration
 */
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

/**
 * Password Requirements
 */
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

/**
 * Username Check
 */
export interface UsernameCheckResponse {
  available: boolean;
  message?: string;
}

/**
 * Email Check
 */
export interface EmailCheckResponse {
  available: boolean;
  message?: string;
}

/**
 * Registration
 */
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

/**
 * Email Verification
 */
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

/**
 * Login
 */
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
}

/**
 * Current User
 */
export interface CurrentUserResponse {
  uid: number;
  username: string;
  email: string;
  picture?: string;
  fullname?: string;
  emailVerified: boolean;
}

/**
 * Logout
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Forgot Password
 */
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Validate Reset Code
 */
export interface ValidateResetCodeRequest {
  code: string;
}

export interface ValidateResetCodeResponse {
  valid: boolean;
  message?: string;
}

/**
 * Reset Password
 */
export interface ResetPasswordRequest {
  code: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Google OAuth
 */
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

// ============================================================================
// FORM DATA TYPES (for react-hook-form)
// ============================================================================

export interface SignupData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  profilePicture?: File;
  acceptTerms: boolean;
}