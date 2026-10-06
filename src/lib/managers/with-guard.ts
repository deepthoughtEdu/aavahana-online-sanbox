import toast from "react-hot-toast";
import { logger } from './logger';
import { humanizeErrorMessage } from '../api/error-messages';

/**
 * ============================================
 * ERROR TYPES
 * ============================================
 */

/**
 * Validation error from Zod
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  errors?: ValidationError[];
  message?: string;
  /**
   * A pdgms API error body is NodeBB-shaped — `{status: {code, message}, response: {...}}` — and an
   * error's machine-readable payload rides in `response`, alongside where NodeBB itself puts
   * `params` for required-parameters-missing.
   *
   * BL errors across pdgms/crm attach `.detail` to the thrown Error (funnel publish's
   * `crm-funnel-publish-incompatible` -> `{missingOrders}`, `crm-funnel-not-publishable` -> the
   * blocker list). `formatApiResponse` forwards it generically when present. The shape is
   * error-specific, so callers narrow it themselves.
   */
  response?: {
    detail?: unknown;
    params?: string[];
  };
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public status: number;
  public statusCode: number;
  public data?: ApiErrorResponse;
  public rateLimited?: boolean;
  public retryAfter?: number;
  /**
   * The untouched upstream text, before `resolveApiErrorMessage` turned it into
   * a sentence — e.g. `[[error:invalid-profile-json]] meta.series · masthead`.
   *
   * `message` is what a person reads; `rawMessage` is what code branches on.
   * Only reach for this when you need the machine key or the detail appended
   * after it (see `error-messages.ts` for why the two are kept apart).
   */
  public rawMessage?: string;

  constructor(
    message: string,
    status: number,
    data?: ApiErrorResponse,
    rateLimited?: boolean,
    retryAfter?: number,
    rawMessage?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusCode = status;
    this.data = data;
    this.rateLimited = rateLimited;
    this.retryAfter = retryAfter;
    this.rawMessage = rawMessage;
  }
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  duration: number; // milliseconds
  startTime: number;
  endTime: number;
}

/**
 * ============================================
 * GUARD OPTIONS
 * ============================================
 */

export interface GuardOptions {
  /**
   * Whether to throw error instead of returning { error }
   * @default false
   */
  throw?: boolean;

  /**
   * Whether to show toast notification on error
   * @default true
   */
  toast?: boolean;

  /**
   * Custom toast message for errors
   */
  errorMessage?: string;

  /**
   * Custom toast message for success
   */
  successMessage?: string;

  /**
   * Whether to log errors to console
   * @default true
   */
  log?: boolean;

  /**
   * Whether to track performance metrics
   * @default true (enabled by default!)
   */
  performance?: boolean;

  /**
   * Label for performance tracking and logging
   */
  label?: string;

  /**
   * Custom error handler callback
   */
  onError?: (error: ApiError | Error) => void;

  /**
   * Custom success callback
   */
  onSuccess?: <T>(data: T, metrics?: PerformanceMetrics) => void;

  /**
   * Transform the result before returning
   */
  transform?: <T>(data: T) => T | Promise<T>;

  /**
   * Track errors in logger
   * @default true
   */
  track?: boolean;

  /**
   * Additional context for error tracking
   */
  context?: Record<string, unknown>;
}

/**
 * ============================================
 * ERROR FORMATTER
 * ============================================
 */

const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Format API errors into user-friendly messages.
 *
 * Every candidate goes through `humanizeErrorMessage`, which returns `null` for
 * anything that is not fit to show a person — a raw status line ("HTTP 502: Bad
 * Gateway"), an unresolved i18n key (`[[error:invite-expired]]`), an HTML error
 * page, a bare slug. That last gate matters here because this function also
 * formats plain `Error`s that never went through the api client, whose messages
 * are browser strings like "Failed to fetch".
 */
function formatErrorMessage(error: unknown, customMessage?: string): string {
  // Use custom message if provided
  if (customMessage) {
    return customMessage;
  }

  // Handle ApiError
  if (error instanceof ApiError) {
    // Rate limit error
    if (error.rateLimited && error.retryAfter) {
      const seconds = Math.ceil(error.retryAfter / 1000);
      return `Too many requests. Please wait ${seconds}s before retrying.`;
    }

    const candidates: Array<string | undefined> = [];

    // Validation errors (multiple field errors) are the most specific thing we
    // can say, so they still win.
    if (error.data?.errors && Array.isArray(error.data.errors)) {
      candidates.push(error.data.errors.map((e) => e.message).join(". "));
    }
    candidates.push(error.data?.error, error.data?.message, error.message);

    for (const candidate of candidates) {
      const human = humanizeErrorMessage(candidate);
      if (human) return human;
    }

    return FALLBACK_ERROR_MESSAGE;
  }

  // Handle standard Error
  if (error instanceof Error) {
    return humanizeErrorMessage(error.message) ?? FALLBACK_ERROR_MESSAGE;
  }

  // Handle unknown error types
  return FALLBACK_ERROR_MESSAGE;
}

/**
 * ============================================
 * PERFORMANCE UTILITIES
 * ============================================
 */

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * ============================================
 * WITH GUARD - MAIN FUNCTION
 * ============================================
 */

/**
 * Execute ANY operation with comprehensive error handling, logging, and performance tracking
 * 
 * @description
 * Universal guard function that wraps promises, async functions, and sync functions
 * with automatic error handling, toast notifications, logging, and performance metrics.
 * 
 * **Default Behavior:**
 * - ✅ Toast notifications enabled
 * - ✅ Logging enabled
 * - ✅ Performance tracking enabled
 * - ✅ Error tracking in logger enabled
 * - ❌ External tracking (Sentry) disabled (configured in logger)
 * 
 * @template T - The type of the successful result
 * 
 * @param operation - Promise, async function, or sync function to execute
 * @param options - Configuration options for error handling and logging
 * 
 * @returns Promise that resolves to either the result (T) or an error object { error }
 * 
 * @example
 * // ✅ Basic usage - auto-tracks performance & errors
 * const users = await api.get('/v3/users');
 * if (isError(users)) {
 *   console.log('Failed to load users');
 *   return;
 * }
 * console.log('Loaded', users.length, 'users');
 * 
 * @example
 * // ✅ Login with success callback
 * const user = await api.post(
 *   '/v3/auth/login',
 *   { username, password },
 *   {
 *     successMessage: 'Welcome back!',
 *     onSuccess: (user) => {
 *       router.push('/dashboard');
 *       analytics.track('login_success', { userId: user.uid });
 *     }
 *   }
 * );
 * 
 * @example
 * // ✅ Silent mode (no toast, no logging)
 * const available = await api.get(
 *   `/v3/auth/check-username/${username}`,
 *   undefined,
 *   { toast: false, log: false }
 * );
 * if (isError(available)) {
 *   setUsernameError('Username already taken');
 * }
 * 
 * @example
 * // ✅ Disable performance tracking (if needed)
 * const config = await api.get(
 *   '/v3/config',
 *   undefined,
 *   { performance: false }
 * );
 * 
 * @example
 * // ✅ Custom labels for better tracking
 * const posts = await api.get(
 *   '/v3/posts',
 *   { page: 1, limit: 20 },
 *   {
 *     label: 'Load Dashboard Posts',
 *     onSuccess: (posts, metrics) => {
 *       console.log(`Loaded ${posts.length} posts in ${metrics?.duration}ms`);
 *     }
 *   }
 * );
 * 
 * @example
 * // ✅ Error handling with validation
 * const result = await api.post(
 *   '/v3/auth/register',
 *   formData,
 *   {
 *     errorMessage: 'Registration failed. Please check your information.',
 *     onError: (error) => {
 *       if (isValidationError(error)) {
 *         const errors = getValidationErrors(error);
 *         setFormErrors(errors);
 *       }
 *     }
 *   }
 * );
 * 
 * @example
 * // ✅ Throw mode for try-catch
 * try {
 *   const user = await api.get(
 *     '/v3/auth/me',
 *     undefined,
 *     { throw: true }
 *   );
 *   setUser(user); // user is always defined here
 * } catch (error) {
 *   if (isUnauthorized(error)) {
 *     router.push('/login');
 *   }
 * }
 * 
 * @example
 * // ✅ Sensitive data (disable tracking)
 * const result = await api.put(
 *   '/v3/users/me/password',
 *   { newPassword },
 *   {
 *     track: false, // Don't log password data
 *     successMessage: 'Password updated successfully'
 *   }
 * );
 * 
 * @example
 * // ✅ Complex async operations
 * const dashboard = await withGuard(async () => {
 *   const user = await api.get('/v3/auth/me');
 *   const posts = await api.get(`/v3/users/${user.uid}/posts`);
 *   const stats = await api.get(`/v3/users/${user.uid}/stats`);
 *   return { user, posts, stats };
 * }, { label: 'Load Dashboard' });
 * 
 * @example
 * // ❌ WRONG - Sync function called directly (passes result, not function)
 * await withGuard(sum(1, 2)); // Passes 3, not the function!
 * 
 * @example
 * // ✅ CORRECT - Sync function wrapped
 * await withGuard(() => sum(1, 2)); // Wraps function properly
 */

// Overload: throw = true → always returns T or throws
export async function withGuard<T>(
  operation: Promise<T> | (() => T | Promise<T>),
  options: GuardOptions & { throw: true }
): Promise<T>;

// Overload: throw = false/undefined → returns T | { error }
export async function withGuard<T>(
  operation: Promise<T> | (() => T | Promise<T>),
  options?: GuardOptions
): Promise<T | { error: ApiError | Error }>;

// Implementation
export async function withGuard<T>(
  operation: Promise<T> | (() => T | Promise<T>),
  options: GuardOptions = {}
): Promise<T | { error: ApiError | Error }> {
  // ✅ Default options - EVERYTHING ENABLED except external tracking
  const {
    throw: shouldThrow = false,
    toast: showToast = true,
    errorMessage,
    successMessage,
    log: shouldLog = true,
    performance: performanceEnabled = true, // ✅ ENABLED BY DEFAULT
    label = 'Operation',
    onError,
    onSuccess,
    transform,
    track = true, // ✅ ENABLED BY DEFAULT
    context,
  } = options;

  // ✅ Track start time for performance calculation
  const startTime = performanceEnabled ? performance.now() : 0;
  const startTimestamp = performanceEnabled ? Date.now() : 0;

  try {
    // Execute operation (handle Promise, async function, or sync function)
    let result: T;

    if (typeof operation === 'function') {
      // It's a function - execute it
      const fnResult = operation();
      // Check if it returned a Promise
      result = fnResult instanceof Promise ? await fnResult : fnResult;
    } else if (operation instanceof Promise) {
      // It's already a Promise
      result = await operation;
    } else {
      // ⚠️ It's a plain value - this shouldn't happen!
      // But we can handle it gracefully
      logger.warn('withGuard received a plain value instead of Promise/Function', {
        value: operation,
        type: typeof operation,
      });
      result = operation;
    }

    // ✅ Calculate performance metrics
    const endTime = performanceEnabled ? performance.now() : 0;
    const endTimestamp = performanceEnabled ? Date.now() : 0;
    const duration = performanceEnabled ? endTime - startTime : undefined;

    const performanceMetrics: PerformanceMetrics | undefined = performanceEnabled && duration !== undefined
      ? {
        duration,
        startTime: startTimestamp,
        endTime: endTimestamp,
      }
      : undefined;

    // ✅ Log performance (logger.time already logged it, but we add to success log too)
    if (track && shouldLog) {
      const perfInfo = performanceMetrics
        ? ` in ${formatDuration(performanceMetrics.duration)}`
        : '';

      logger.info(
        `${label} completed successfully${perfInfo}`,
        result,
        performanceMetrics
          ? {
            ...context,
            performance: {
              duration: performanceMetrics.duration,
              durationMs: `${performanceMetrics.duration.toFixed(2)}ms`,
              formatted: formatDuration(performanceMetrics.duration),
            }
          }
          : context
      );
    }

    // Transform result if transformer provided
    if (transform) {
      const transformed = transform(result);
      result = transformed instanceof Promise ? await transformed : transformed;
    }

    // Call success callback if provided
    if (onSuccess) {
      onSuccess(result, performanceMetrics);
    }

    // Show success toast if message provided
    if (successMessage && showToast) {
      toast.success(successMessage);
    }

    return result;
  } catch (err: unknown) {
    // ✅ Calculate error performance metrics
    const endTime = performanceEnabled ? performance.now() : 0;
    const duration = performanceEnabled ? endTime - startTime : undefined;

    // Normalize error
    let normalizedError: ApiError | Error;

    if (err instanceof ApiError) {
      normalizedError = err;

      // ✅ Log with logger + performance
      if (shouldLog) {
        const perfInfo = duration ? ` (failed after ${formatDuration(duration)})` : '';

        logger.error(
          `API Error in ${label}${perfInfo}`,
          err,
          {
            status: err.status,
            data: err.data,
            rateLimited: err.rateLimited,
            ...(duration !== undefined && {
              performance: {
                duration,
                durationMs: `${duration.toFixed(2)}ms`,
                formatted: formatDuration(duration),
              }
            }),
            ...context,
          }
        );
      }
    } else if (err instanceof Error) {
      normalizedError = err;

      // ✅ Log with logger + performance
      if (shouldLog) {
        const perfInfo = duration ? ` (failed after ${formatDuration(duration)})` : '';

        logger.error(
          `Error in ${label}${perfInfo}`,
          err,
          {
            ...(duration !== undefined && {
              performance: {
                duration,
                durationMs: `${duration.toFixed(2)}ms`,
                formatted: formatDuration(duration),
              }
            }),
            ...context,
          }
        );
      }
    } else {
      normalizedError = new Error(String(err));

      // ✅ Log with logger + performance
      if (shouldLog) {
        const perfInfo = duration ? ` (failed after ${formatDuration(duration)})` : '';

        logger.error(
          `Unknown error in ${label}${perfInfo}`,
          err,
          {
            ...(duration !== undefined && {
              performance: {
                duration,
                durationMs: `${duration.toFixed(2)}ms`,
                formatted: formatDuration(duration),
              }
            }),
            ...context,
          }
        );
      }
    }

    // Call error callback if provided
    if (onError) {
      onError(normalizedError);
    }

    // Show toast notification
    if (showToast) {
      const message = formatErrorMessage(normalizedError, errorMessage);
      toast.error(message);
    }

    // Either throw or return error
    if (shouldThrow) {
      throw normalizedError;
    }

    return { error: normalizedError };
  }
}

/**
 * ============================================
 * CONVENIENCE FUNCTIONS
 * ============================================
 */

/**
 * Silent guard - no toast notifications, no console logs
 * 
 * @description
 * Use for background operations or when you want to handle errors manually
 * without showing toast notifications to the user.
 * 
 * **Note:** Performance tracking is still enabled. Use `{ toast: false, log: false, performance: false }` to disable everything.
 * 
 * @example
 * // Check username availability silently
 * const result = await api.get(
 *   `/v3/auth/check-username/${username}`,
 *   undefined,
 *   { toast: false, log: false }
 * );
 * if (isError(result)) {
 *   setUsernameError('Username already taken');
 * }
 * 
 * @example
 * // Verify session silently on app load
 * const user = await api.get('/v3/auth/verify', undefined, {
 *   toast: false,
 *   log: false
 * });
 * if (!isError(user) && user) {
 *   setCurrentUser(user);
 * }
 */
export async function withSilentGuard<T>(
  operation: Promise<T> | (() => T | Promise<T>)
): Promise<T | { error: ApiError | Error }> {
  return withGuard(operation, { toast: false, log: false });
}

/**
 * Strict guard - always throws errors (for use in try-catch blocks)
 * 
 * @description
 * Use when you want to handle errors in a try-catch block instead of
 * checking for error objects. Errors are still logged and toasted.
 * Performance tracking is enabled by default.
 * 
 * @example
 * try {
 *   const user = await api.get('/v3/auth/me', undefined, { throw: true });
 *   setUser(user); // user is always defined here (never { error })
 * } catch (error) {
 *   console.error('Failed to load user');
 *   router.push('/login');
 * }
 * 
 * @example
 * // In async function with error boundary
 * async function loadUserData() {
 *   try {
 *     const user = await api.get('/v3/auth/me', undefined, { throw: true });
 *     const posts = await api.get(`/v3/users/${user.uid}/posts`, undefined, { throw: true });
 *     return { user, posts };
 *   } catch (error) {
 *     throw error; // Let error boundary handle it
 *   }
 * }
 */
export async function withStrictGuard<T>(
  operation: Promise<T> | (() => T | Promise<T>)
): Promise<T> {
  return withGuard(operation, { throw: true });
}

/**
 * Silent strict guard - throws errors without toast/logs
 * 
 * @example
 * try {
 *   const data = await withSilentStrictGuard(() => JSON.parse(jsonString));
 * } catch (error) {
 *   // Handle error silently
 *   return getDefaultConfig();
 * }
 */
export async function withSilentStrictGuard<T>(
  operation: Promise<T> | (() => T | Promise<T>)
): Promise<T> {
  return withGuard(operation, { throw: true, toast: false, log: false });
}

/**
 * Guard with performance tracking
 * 
 * @description
 * Explicitly enables performance tracking with a custom label.
 * **Note:** Performance is already enabled by default, so this is mainly useful for custom labeling.
 * 
 * @example
 * // Track with custom label
 * const users = await withPerformance(
 *   api.get('/v3/users'),
 *   'Load All Users'
 * );
 * // Console: ⚡ [PERFORMANCE] Load All Users: 234ms
 */
export async function withPerformance<T>(
  operation: Promise<T> | (() => T | Promise<T>),
  label?: string
): Promise<T | { error: ApiError | Error }> {
  return withGuard(operation, {
    performance: true,
    label: label || 'Operation'
  });
}

/**
 * Guard with logging enabled (logs both success and errors)
 * 
 * @description
 * **Note:** Logging is already enabled by default, so this is mainly for explicit intent.
 * 
 * @example
 * const config = await withLog(api.get('/v3/config'), 'Load Config');
 * // Console: ℹ️ [INFO] Load Config Success: {...}
 */
export async function withLog<T>(
  operation: Promise<T> | (() => T | Promise<T>),
  label?: string
): Promise<T | { error: ApiError | Error }> {
  return withGuard(operation, {
    log: true,
    label: label || 'Operation',
    onSuccess: (data) => {
      logger.info(`${label || 'Operation'} Success`, data);
    },
  });
}

/**
 * Guard with both logging and performance tracking
 * 
 * @description
 * **Note:** Both are already enabled by default, so this is mainly for explicit intent.
 * 
 * @example
 * const user = await withLogAndPerformance(
 *   api.post('/v3/auth/login', { username, password }),
 *   'User Login'
 * );
 * // Console: ℹ️ [INFO] User Login Success in 456ms: {...}
 */
export async function withLogAndPerformance<T>(
  operation: Promise<T> | (() => T | Promise<T>),
  label?: string
): Promise<T | { error: ApiError | Error }> {
  return withGuard(operation, {
    log: true,
    performance: true,
    label: label || 'Operation',
    onSuccess: (data, metrics) => {
      logger.info(
        `${label || 'Operation'} Success`,
        data,
        { duration: metrics?.duration }
      );
    },
  });
}

/**
 * Guard with no error tracking (for sensitive operations)
 * 
 * @description
 * Prevents logging sensitive data like passwords or payment info.
 * Errors are still shown to the user via toast.
 * 
 * @example
 * // Don't track password changes in logs
 * const result = await api.put(
 *   '/v3/users/me/password',
 *   { newPassword },
 *   { track: false }
 * );
 * 
 * @example
 * // Don't track payment information
 * const result = await withoutTracking(
 *   PaymentService.processPayment(cardDetails)
 * );
 */
export async function withoutTracking<T>(
  operation: Promise<T> | (() => T | Promise<T>)
): Promise<T | { error: ApiError | Error }> {
  return withGuard(operation, { track: false });
}

/**
 * Guard for debugging - verbose logging with performance metrics
 * 
 * @description
 * Logs operation start, result, performance metrics, and any errors.
 * Use during development to debug complex operations.
 * 
 * @example
 * const dashboard = await withDebug(async () => {
 *   const user = await api.get('/v3/auth/me');
 *   const posts = await api.get(`/v3/users/${user.uid}/posts`);
 *   const comments = await api.get(`/v3/users/${user.uid}/comments`);
 *   return { user, posts, comments };
 * }, 'Load Dashboard');
 * // Console:
 * // 🔍 [DEBUG] Starting: Load Dashboard
 * // ⚡ [PERFORMANCE] Load Dashboard: 1.23s
 * // ✅ [DEBUG] Success: Load Dashboard { duration: "1.23s", result: {...} }
 */
export async function withDebug<T>(
  operation: Promise<T> | (() => T | Promise<T>),
  label?: string
): Promise<T | { error: ApiError | Error }> {
  const debugLabel = label || 'Operation';

  logger.debug(`Starting: ${debugLabel}`);

  return withGuard(operation, {
    log: true,
    performance: true,
    label: debugLabel,
    onSuccess: (data, metrics) => {
      logger.debug(`Success: ${debugLabel}`, {
        duration: formatDuration(metrics?.duration || 0),
        result: data,
      });
    },
    onError: (error) => {
      logger.error(`Failed: ${debugLabel}`, error);
    },
  });
}

/**
 * Guard for production - minimal logging, tracks errors
 * 
 * @description
 * Optimized for production: no console logs, shows user-facing toasts,
 * tracks errors for monitoring. Performance tracking is still enabled.
 * 
 * @example
 * const user = await withProduction(
 *   api.post('/v3/auth/login', { username, password })
 * );
 */
export async function withProduction<T>(
  operation: Promise<T> | (() => T | Promise<T>)
): Promise<T | { error: ApiError | Error }> {
  return withGuard(operation, {
    log: false,
    toast: true,
    track: true,
  });
}

/**
 * Guard with automatic retry logic
 * 
 * @description
 * Automatically retries failed operations with configurable delay.
 * Useful for network-related operations that might fail temporarily.
 * 
 * @param operation - Function that returns a Promise (NOT a direct promise!)
 * @param options - Retry configuration
 * 
 * @example
 * // Retry with defaults (3 retries, 1s delay)
 * const user = await withRetry(
 *   () => api.get('/v3/auth/me'),
 *   { label: 'Load User' }
 * );
 * 
 * @example
 * // Custom retry configuration
 * const data = await withRetry(
 *   () => api.get('/v3/users/me'),
 *   {
 *     maxRetries: 5,
 *     delay: 2000,
 *     label: 'Load User Data'
 *   }
 * );
 * // Console:
 * // ⚠️ [WARN] Retrying in 2000ms { attempt: 1, maxRetries: 5 }
 * // ℹ️ [INFO] Retry Success { attempt: 2, label: 'Load User Data' }
 * 
 * @example
 * // ❌ WRONG - Direct promise (won't re-execute on retry)
 * await withRetry(api.get('/v3/users/me'));
 * 
 * @example
 * // ✅ CORRECT - Function that returns promise
 * await withRetry(() => api.get('/v3/users/me'));
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delay?: number;
    label?: string;
  }
): Promise<T | { error: ApiError | Error }> {
  const { maxRetries = 3, delay = 1000, label = 'Operation' } = options || {};

  let lastError: ApiError | Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await withGuard(operation, {
      toast: attempt === maxRetries,
      log: true,
      label: `${label} (Attempt ${attempt}/${maxRetries})`,
    });

    if (!isError(result)) {
      if (attempt > 1) {
        logger.info(`Retry Success`, { attempt, label });
      }
      return result;
    }

    lastError = result.error;

    if (attempt < maxRetries) {
      logger.warn(`Retrying in ${delay}ms`, { attempt, maxRetries, label });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { error: lastError! };
}

/**
 * ============================================
 * HELPER UTILITIES
 * ============================================
 */

/**
 * Type guard to check if result is an error
 * 
 * @example
 * const result = await api.post('/v3/auth/login', { username, password });
 * if (isError(result)) {
 *   console.log('Login failed:', result.error.message);
 *   return;
 * }
 * // result is User type here
 * console.log('Welcome', result.username);
 */
export function isError<T>(
  result: T | { error: ApiError | Error }
): result is { error: ApiError | Error } {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    (result.error instanceof ApiError || result.error instanceof Error)
  );
}

/**
 * Extract validation error for a specific field
 * 
 * @example
 * const result = await api.post('/v3/auth/register', formData);
 * if (isError(result)) {
 *   const emailError = getFieldError(result.error, 'email');
 *   const passwordError = getFieldError(result.error, 'password');
 *   setFormErrors({ email: emailError, password: passwordError });
 * }
 */
export function getFieldError(
  error: ApiError | Error | undefined,
  field: string
): string | undefined {
  if (error instanceof ApiError && error.data?.errors) {
    const fieldError = error.data.errors.find((e) => e.field === field);
    return fieldError?.message;
  }
  return undefined;
}

/**
 * Get all validation errors as a field-to-messages map
 * 
 * @example
 * const result = await api.post('/v3/auth/register', formData);
 * if (isError(result)) {
 *   const errors = getValidationErrors(result.error);
 *   // { email: ['Invalid email'], password: ['Too short', 'No uppercase'] }
 *   Object.entries(errors).forEach(([field, messages]) => {
 *     setFieldError(field, messages.join(', '));
 *   });
 * }
 */
export function getValidationErrors(
  error: ApiError | Error | undefined
): Record<string, string[]> {
  if (!(error instanceof ApiError) || !error.data?.errors) {
    return {};
  }

  const errorMap: Record<string, string[]> = {};

  error.data.errors.forEach((err) => {
    if (!errorMap[err.field]) {
      errorMap[err.field] = [];
    }
    errorMap[err.field].push(err.message);
  });

  return errorMap;
}

/**
 * Check if error has a specific HTTP status code
 * 
 * @example
 * const result = await api.get('/v3/auth/me');
 * if (isError(result) && isStatus(result.error, 401)) {
 *   router.push('/login');
 * }
 */
export function isStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}

/**
 * Check if error is a validation error (400 with field errors)
 */
export function isValidationError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status === 400 &&
    !!error.data?.errors
  );
}

/**
 * Check if error is rate limited (429)
 * 
 * @example
 * const result = await api.post('/v3/auth/login', credentials);
 * if (isError(result) && isRateLimited(result.error)) {
 *   console.log('Too many login attempts, please wait');
 * }
 */
export function isRateLimited(error: unknown): boolean {
  return error instanceof ApiError && !!error.rateLimited;
}

/**
 * Check if error is unauthorized (401)
 * 
 * @example
 * const result = await api.get('/v3/admin/users');
 * if (isError(result) && isUnauthorized(result.error)) {
 *   router.push('/login');
 * }
 */
export function isUnauthorized(error: unknown): boolean {
  return isStatus(error, 401);
}

/**
 * Check if error is forbidden (403)
 */
export function isForbidden(error: unknown): boolean {
  return isStatus(error, 403);
}

/**
 * Check if error is not found (404)
 */
export function isNotFound(error: unknown): boolean {
  return isStatus(error, 404);
}