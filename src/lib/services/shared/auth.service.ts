import { api, ApiResult, clearCsrfToken, isError } from "@/lib/api/client";
import { User } from "@/types";
import { logger } from "@/lib/managers/logger";
import type {
  AuthConfig, PasswordRequirements, UsernameCheckResponse, EmailCheckResponse,
  RegisterRequest, RegisterResponse, VerifyEmailRequest, VerifyEmailResponse,
  ResendVerificationRequest, ResendVerificationResponse, LoginRequest, LoginResponse,
  LogoutResponse, ForgotPasswordRequest, ForgotPasswordResponse,
  ValidateResetCodeRequest, ValidateResetCodeResponse, ResetPasswordRequest, ResetPasswordResponse,
  GoogleCallbackParams, GoogleVerifyResponse, UnlinkGoogleResponse,
} from './auth.types';

// Re-export all types for backward compatibility
export type {
  AuthConfig, PasswordRequirements, UsernameCheckResponse, EmailCheckResponse,
  RegisterRequest, RegisterResponse, VerifyEmailRequest, VerifyEmailResponse,
  ResendVerificationRequest, ResendVerificationResponse, LoginRequest, LoginResponse,
  LogoutResponse, ForgotPasswordRequest, ForgotPasswordResponse,
  ValidateResetCodeRequest, ValidateResetCodeResponse, ResetPasswordRequest, ResetPasswordResponse,
  GoogleCallbackParams, GoogleVerifyResponse, UnlinkGoogleResponse,
};

/**
 * ============================================
 * AUTHENTICATION SERVICE
 * ============================================
 *
 * All methods use api client with built-in:
 * - ✅ Error handling (returns ApiResult<T>)
 * - ✅ Performance tracking
 * - ✅ Logging
 * - ✅ Toast notifications (configurable)
 * - ✅ Rate limiting protection
 *
 * @example
 * const result = await AuthService.login({ username, password });
 * if (isError(result)) {
 *   setError(result.error.message);
 *   return;
 * }
 * // result is LoginResponse here
 * router.push('/dashboard');
 */
export class AuthService {
  /**
   * ============================================
   * PUBLIC ENDPOINTS
   * ============================================
   */

  /**
   * Get public authentication configuration
   *
   * @example
   * const config = await AuthService.getConfig();
   * if (!isError(config)) {
   *   setRegistrationEnabled(config.registrationEnabled);
   * }
   */
  static async getConfig(): Promise<ApiResult<AuthConfig>> {
    return await api.get<AuthConfig>('/v3/auth/config', undefined, { label: 'Get Auth Config', toast: false });
  }

  /**
   * Get password strength requirements
   *
   * @example
   * const requirements = await AuthService.getPasswordRequirements();
   * if (!isError(requirements)) {
   *   setMinLength(requirements.minLength);
   * }
   */
  static async getPasswordRequirements(): Promise<ApiResult<PasswordRequirements>> {
    return await api.get<PasswordRequirements>(
      '/v3/auth/password-requirements',
      undefined,
      { label: 'Get Password Requirements', toast: false }
    );
  }

  /**
   * ============================================
   * REGISTRATION & VALIDATION
   * ============================================
   */

  /**
   * Check if username is available
   *
   * @example
   * const result = await AuthService.checkUsername('johndoe');
   * if (isError(result)) {
   *   setUsernameError('Unable to check username');
   *   return;
   * }
   * if (!result.available) {
   *   setUsernameError('Username already taken');
   * }
   */
  static async checkUsername(username: string): Promise<ApiResult<UsernameCheckResponse>> {
    return await api.get<UsernameCheckResponse>(`/v3/auth/check-username/${username}`, undefined, { label: 'Check Username', toast: false, log: false });
  }

  /**
   * Check if email is available
   *
   * @example
   * const result = await AuthService.checkEmail('john@example.com');
   * if (isError(result)) {
   *   setEmailError('Unable to check email');
   *   return;
   * }
   * if (!result.available) {
   *   setEmailError('Email already registered');
   * }
   */
  static async checkEmail(email: string): Promise<ApiResult<EmailCheckResponse>> {
    return await api.get<EmailCheckResponse>(`/v3/auth/check-email/${email}`, undefined, { label: 'Check Email', toast: false, log: false });
  }

  /**
   * Register new user account
   *
   * @example
   * const result = await AuthService.register({
   *   username: 'johndoe',
   *   email: 'john@example.com',
   *   password: 'SecurePass123!'
   * });
   * if (isError(result)) {
   *   if (isValidationError(result.error)) {
   *     const errors = getValidationErrors(result.error);
   *     setFormErrors(errors);
   *   }
   *   return;
   * }
   * router.push(`/auth/verify-otp?email=${result.email}`);
   */
  static async register(data: RegisterRequest): Promise<ApiResult<RegisterResponse>> {
    return await api.post<RegisterResponse>(
      '/v3/auth/register',
      data,
      { label: 'User Registration', successMessage: 'Account created! Please verify your email.' }
    );
  }

  /**
   * ============================================
   * EMAIL VERIFICATION
   * ============================================
   */

  /**
   * Verify email with verification code
   *
   * @example
   * const result = await AuthService.verifyEmail({ code: '123456' });
   * if (isError(result)) {
   *   setError('Invalid verification code');
   *   return;
   * }
   * router.push('/dashboard');
   */
  static async verifyEmail(data: VerifyEmailRequest): Promise<ApiResult<VerifyEmailResponse>> {
    return await api.post<VerifyEmailResponse>('/v3/auth/verify-email', data, { label: 'Verify Email', successMessage: 'Email verified successfully!' });
  }

  /**
   * Resend email verification code
   *
   * @example
   * const result = await AuthService.resendVerification({ email: 'john@example.com' });
   * if (isError(result)) {
   *   setError('Failed to resend verification code');
   *   return;
   * }
   */
  static async resendVerification(data: ResendVerificationRequest): Promise<ApiResult<ResendVerificationResponse>> {
    return await api.post<ResendVerificationResponse>('/v3/auth/resend-verification', data, { label: 'Resend Verification', successMessage: 'Verification code sent!' });
  }

  /**
   * ============================================
   * AUTHENTICATION
   * ============================================
   */

  /**
   * Login user with username/password
   *
   * @example
   * const result = await AuthService.login({
   *   username: 'johndoe',
   *   password: 'SecurePass123!'
   * });
   * if (isError(result)) {
   *   setError(result.error.message);
   *   return;
   * }
   * localStorage.setItem('user', JSON.stringify(result));
   * router.push('/dashboard');
   */
  static async login(data: LoginRequest): Promise<ApiResult<LoginResponse>> {
    const result = await api.post<LoginResponse>('/v3/auth/login', data, { label: 'User Login', successMessage: 'Welcome back!' });
    // The CSRF token is bound to the session. Login establishes a NEW session,
    // so any token cached for the previous (anonymous) session is now stale —
    // clear it so the next write request (e.g. invite change-password) fetches
    // a fresh token instead of failing with "invalid csrf token".
    if (!isError(result)) clearCsrfToken();
    return result;
  }

  /**
   * Get current authenticated user
   *
   * @example
   * const user = await AuthService.getCurrentUser();
   * if (isError(user)) {
   *   router.push('/login');
   *   return;
   * }
   * setUser(user);
   */
  static async getCurrentUser(): Promise<ApiResult<{ user: User }>> {
    // auth-refactor Step 3: route through the BFF session endpoint, which
    // server-verifies the HttpOnly session cookie (the single source of truth)
    // instead of the raw proxied me(). ApiService prefixes '/api', so this
    // resolves to /api/auth/session; the response envelope is identical, so
    // callers and the api-client unwrapping are unchanged.
    return await api.get<{ user: User }>('/auth/session', undefined, { label: 'Get Current User', toast: false });
  }

  /**
   * Alias for getCurrentUser()
   * Used by useAuth hook for consistency
   *
   * @example
   * const user = await AuthService.me();
   * if (isError(user)) {
   *   return null;
   * }
   * return user;
   */
  static async me(): Promise<ApiResult<{ user: User }>> {
    return AuthService.getCurrentUser();
  }

  /**
   * Logout current user
   *
   * @example
   * const result = await AuthService.logout();
   * if (!isError(result)) {
   *   localStorage.removeItem('user');
   *   router.push('/login');
   * }
   */
  static async logout(): Promise<ApiResult<LogoutResponse>> {
    return await api.post<LogoutResponse>('/v3/auth/logout', undefined, { label: 'User Logout', successMessage: 'Logged out successfully' });
  }

  /**
   * ============================================
   * PASSWORD RESET
   * ============================================
   */

  /**
   * Request password reset email
   *
   * @example
   * const result = await AuthService.forgotPassword({
   *   email: 'john@example.com'
   * });
   * if (isError(result)) {
   *   setError('Failed to send reset email');
   *   return;
   * }
   * router.push(`/auth/verify-otp?email=${email}&type=reset`);
   */
  static async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResult<ForgotPasswordResponse>> {
    return await api.post<ForgotPasswordResponse>('/v3/auth/forgot-password', data, { label: 'Forgot Password', successMessage: 'Password reset code sent to your email' });
  }

  /**
   * Validate password reset code
   *
   * @example
   * const result = await AuthService.validateResetCode({ code: '123456' });
   * if (isError(result) || !result.valid) {
   *   setError('Invalid or expired reset code');
   *   return;
   * }
   */
  static async validateResetCode(data: ValidateResetCodeRequest): Promise<ApiResult<ValidateResetCodeResponse>> {
    return await api.post<ValidateResetCodeResponse>('/v3/auth/validate-reset-code', data, { label: 'Validate Reset Code', toast: false });
  }

  /**
   * Reset password with code
   *
   * @example
   * const result = await AuthService.resetPassword({
   *   code: '123456',
   *   newPassword: 'NewSecurePass123!'
   * });
   * if (isError(result)) {
   *   setError('Failed to reset password');
   *   return;
   * }
   * router.push('/auth/login?message=password_reset_success');
   */
  static async resetPassword(data: ResetPasswordRequest): Promise<ApiResult<ResetPasswordResponse>> {
    return await api.post<ResetPasswordResponse>('/v3/auth/reset-password', data, { label: 'Reset Password', successMessage: 'Password reset successfully!' });
  }

  /**
   * ============================================
   * GOOGLE OAUTH
   * ============================================
   */

  /**
   * Initiate Google OAuth flow
   * Redirects to Google login page
   *
   * @example
   * <button onClick={() => AuthService.loginWithGoogle()}>
   *   Login with Google
   * </button>
   */
  static loginWithGoogle(): void {
    logger.info('[Auth] Initiating Google OAuth');
    window.location.href = '/api/v3/auth/google';
  }

  /**
   * Verify Google OAuth callback
   * Called from callback page after Google redirects back
   *
   * @example
   * const params = {
   *   code: searchParams.get('code')!,
   *   scope: searchParams.get('scope'),
   * };
   *
   * const result = await AuthService.verifyGoogleCallback(params);
   * if (isError(result)) {
   *   router.push('/auth/login?error=google_auth_failed');
   *   return;
   * }
   * localStorage.setItem('user', JSON.stringify(result));
   * router.push('/dashboard');
   */
  static async verifyGoogleCallback(params: GoogleCallbackParams): Promise<ApiResult<LoginResponse>> {
    logger.info('[Auth] Verifying Google OAuth callback', { codePrefix: params.code.substring(0, 20) });
    return await api.get<LoginResponse>('/v3/auth/google/callback', { code: params.code, scope: params.scope, authuser: params.authuser, prompt: params.prompt }, { label: 'Google OAuth Callback', successMessage: 'Signed in with Google!' });
  }

  /**
   * Verify Google OAuth link status
   * Check if current user has Google account linked
   *
   * @example
   * const result = await AuthService.verifyGoogleLink();
   * if (!isError(result)) {
   *   setGoogleLinked(result.status === 'linked');
   * }
   */
  static async verifyGoogleLink(): Promise<ApiResult<GoogleVerifyResponse>> {
    return await api.get<GoogleVerifyResponse>('/v3/auth/google/verify', undefined, { label: 'Verify Google Link', toast: false, log: false });
  }

  /**
   * Unlink Google account from user
   *
   * @example
   * const result = await AuthService.unlinkGoogle();
   * if (!isError(result)) {
   *   setGoogleLinked(false);
   * }
   */
  static async unlinkGoogle(): Promise<ApiResult<UnlinkGoogleResponse>> {
    return await api.post<UnlinkGoogleResponse>('/v3/auth/google/unlink', undefined, { label: 'Unlink Google Account', successMessage: 'Google account unlinked successfully' });
  }
}
