import { PaginationParams } from '@/types';
import { apiRateLimiter } from './rate-limiter';
import {
  ApiError,
  withGuard,
  GuardOptions,
  ApiErrorResponse
} from '../managers/with-guard';
import { resolveApiErrorMessage, messageForStatus } from './error-messages';

/**
 * ============================================
 * TYPE UTILITIES
 * ============================================
 */

/**
 * Result type that can be either success (T) or error
 * Used when throw: false in GuardOptions
 */
export type ApiResult<T> = T | { error: ApiError | Error };

export type ApiCallOptions = GuardOptions & {
  /** Send without auth cookies, context headers, or CSRF token */
  public?: boolean;
};

/**
 * ============================================
 * CONTEXT MANAGER
 * ============================================
 */
class ApiContext {
  private context: Record<string, string> = {};

  set(key: string, value: string | null) {
    if (value === null) {
      delete this.context[key];
    } else {
      this.context[key] = value;
    }
  }

  get(key: string): string | undefined {
    return this.context[key];
  }

  getAll(): Record<string, string> {
    return { ...this.context };
  }

  clear() {
    this.context = {};
  }
}

const apiContext = new ApiContext();

/**
 * ============================================
 * CSRF TOKEN CACHE
 * ============================================
 */
let csrfToken: string = '';
let csrfFetchPromise: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = fetch('/api/config', { credentials: 'include' })
    .then(res => (res.ok ? res.json() : {}))
    .then((cfg: Record<string, unknown>) => {
      csrfToken = (cfg.csrf_token as string) ?? '';
      csrfFetchPromise = null;
      return csrfToken;
    })
    .catch(() => {
      csrfFetchPromise = null;
      return '';
    });

  return csrfFetchPromise;
}

export function clearCsrfToken() {
  csrfToken = '';
  csrfFetchPromise = null;
}

/**
 * ============================================
 * BASE API CLIENT
 * ✅ Uses withGuard internally
 * ✅ Returns T | { error } by default (safe pattern)
 * ✅ Can throw with throw: true for try-catch usage
 * ============================================
 */
class ApiClient {
  protected buildUrl(path: string, params?: PaginationParams): string {
    let finalPath = path;
    const contextValues = apiContext.getAll();

    // Replace :placeholders with context values
    for (const [key, value] of Object.entries(contextValues)) {
      finalPath = finalPath.replace(`:${key}`, value);
    }

    const url = new URL(finalPath, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Smart body serialization
   */
  protected sanitize(data: unknown): unknown {
    if (!data) return undefined;
    if (data instanceof FormData) return data;
    if (typeof data === 'object') return JSON.stringify(data);
    return data;
  }

  /**
   * Core request method (without guard - used internally)
   */
  protected async rawRequest<T>(
    url: string,
    options: RequestInit = {},
    isPublic = false
  ): Promise<T> {
    const method = options.method || 'GET';

    // Check rate limit. Reads are exempt (2026-09-12): a write invalidates several reads at once
    // and the refetch burst tripped the throttle on the dialler's undo, surfacing as "Too many
    // requests" for one ordinary press. Reads are safe to repeat and the server has its own limits;
    // the throttle stays on writes, where a stuck finger or a runaway loop can do damage.
    const isAllowed = method === 'GET' || await apiRateLimiter.checkLimit(url, method);

    if (!isAllowed) {
      const timeUntilReset = apiRateLimiter.getTimeUntilReset(url, method);
      throw new ApiError(
        `Rate limit exceeded. Please wait ${Math.ceil(timeUntilReset / 1000)}s before retrying.`,
        429,
        {
          success: false,
          error: 'Rate limit exceeded',
          message: `Please wait ${Math.ceil(timeUntilReset / 1000)} seconds before retrying.`,
        },
        true,
        timeUntilReset
      );
    }

    // Detect FormData
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {};

    if (options.headers) {
      const existingHeaders = new Headers(options.headers);
      existingHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    }

    if (!isPublic) {
      // Add organization context headers from API context if available
      const organizationId = apiContext.get('organizationId');
      if (organizationId) {
        headers['X-Organization-Id'] = organizationId;
      }

      const userId = apiContext.get('uid');
      if (userId) {
        headers['X-User-Id'] = userId;
      }

      const employeeId = apiContext.get('eid');
      if (employeeId) {
        headers['X-Employee-Id'] = employeeId;
      }

      // Include CSRF token for write requests
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const token = await getCsrfToken();
        if (token) {
          headers['x-csrf-token'] = token;
        }
      }
    }

    // Don't set Content-Type for FormData
    if (isFormData) {
      delete headers['Content-Type'];
      delete headers['content-type'];
    } else if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: isPublic ? 'omit' : 'include',
      });

      if (!response.ok) {
        // Read as TEXT first, not json(). NodeBB sends login failures as
        // `res.status(403).send('[[error:invalid-login-credentials]]')` — a
        // text/html body — so `response.json()` threw and the old catch fell
        // back to "HTTP 403: Forbidden", which is what users were seeing
        // instead of a real message. Text always parses; JSON is attempted on
        // top of it so structured bodies keep their `errors[]` / `response`.
        const rawText = await response.text().catch(() => '');

        let parsed: Record<string, unknown> | undefined;
        if (rawText) {
          try {
            const json = JSON.parse(rawText);
            if (json && typeof json === 'object') parsed = json as Record<string, unknown>;
          } catch {
            // Not JSON — rawText carries the message on its own.
          }
        }

        const message = resolveApiErrorMessage({
          status: response.status,
          statusText: response.statusText,
          body: parsed,
          rawText,
        });

        // Keep the untouched upstream text on `rawMessage`: a few screens parse
        // the i18n key deliberately (see error-messages.ts).
        const rawMessage =
          (typeof parsed?.error === 'string' && parsed.error) ||
          (typeof parsed?.message === 'string' && parsed.message) ||
          rawText ||
          message;

        throw new ApiError(
          message,
          response.status,
          {
            ...(parsed as Partial<ApiErrorResponse> | undefined),
            success: false,
            // `error` is what formatErrorMessage reads for the toast — it must
            // be the human sentence, not the key.
            error: message,
          },
          undefined,
          undefined,
          rawMessage,
        );
      }

      const json = await response.json();
      return json.response as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // A thrown fetch means the request never reached a server (offline, DNS,
      // CORS, aborted). "Failed to fetch" is a browser string, not a message.
      const rawMessage = error instanceof Error ? error.message : 'Network error';
      const message = messageForStatus(0);
      throw new ApiError(
        message,
        0,
        {
          success: false,
          error: message,
        },
        undefined,
        undefined,
        rawMessage,
      );
    }
  }

  /**
   * GET request
   * 
   * **Default behavior: Returns T | { error }** (safe for components)
   * Use `throw: true` for try-catch pattern (services)
   * 
   * @example
   * // ✅ In components - safe pattern (default)
   * const result = await api.get('/v3/users');
   * if (isError(result)) {
   *   console.log('Failed');
   *   return;
   * }
   * // result is User[] here
   * 
   * @example
   * // ✅ Silent check (no toast)
   * const result = await api.get('/v3/check-username/john', undefined, {
   *   toast: false
   * });
   */
  async get<T>(
    path: string,
    params?: PaginationParams,
    options?: ApiCallOptions
  ): Promise<ApiResult<T>> {
    const url = this.buildUrl(path, params);
    const { public: isPublic, ...guardOptions } = options ?? {};

    return withGuard(
      this.rawRequest<T>(url, { method: 'GET' }, isPublic),
      {
        label: `GET ${path}`,
        ...guardOptions,
      }
    ) as Promise<ApiResult<T>>;
  }

  /**
   * Download a file (binary/CSV/ZIP). Reuses the same URL + org-context headers
   * as other requests, but reads the response as a Blob and triggers a browser
   * save. Returns the saved filename, or throws on a non-OK response.
   */
  async download(path: string, fallbackFilename = 'download'): Promise<string> {
    const url = this.buildUrl(path);
    const headers: Record<string, string> = {};
    const organizationId = apiContext.get('organizationId');
    if (organizationId) headers['X-Organization-Id'] = organizationId;
    const userId = apiContext.get('uid');
    if (userId) headers['X-User-Id'] = userId;
    const employeeId = apiContext.get('eid');
    if (employeeId) headers['X-Employee-Id'] = employeeId;

    const response = await fetch(url, { method: 'GET', headers, credentials: 'include' });
    if (!response.ok) {
      // A download response is normally binary, so there is rarely a message to
      // read; fall back to the per-status wording rather than "HTTP 502".
      const rawText = await response.text().catch(() => '');
      let parsed: unknown;
      try {
        parsed = rawText ? JSON.parse(rawText) : undefined;
      } catch {
        parsed = undefined;
      }
      const message = resolveApiErrorMessage({
        status: response.status,
        statusText: response.statusText,
        body: parsed,
        rawText,
      });
      throw new ApiError(
        message,
        response.status,
        { success: false, error: message },
        undefined,
        undefined,
        rawText || message,
      );
    }

    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : fallbackFilename;

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(objectUrl);
    return filename;
  }

  /**
   * POST request
   *
   * **Default behavior: Returns T | { error }**
   *
   * @example
   * // ✅ In components
   * const result = await api.post('/v3/auth/login', { username, password });
   * if (isError(result)) {
   *   setError(result.error.message);
   *   return;
   * }
   * // result is User here
   */
  async post<T>(
    path: string,
    data?: unknown,
    options?: ApiCallOptions
  ): Promise<ApiResult<T>> {
    const url = this.buildUrl(path);
    const { public: isPublic, ...guardOptions } = options ?? {};

    return withGuard(
      this.rawRequest<T>(url, {
        method: 'POST',
        body: this.sanitize(data) as BodyInit,
      }, isPublic),
      {
        label: `POST ${path}`,
        ...guardOptions,
      }
    ) as Promise<ApiResult<T>>;
  }

  /**
   * PUT request
   */
  async put<T>(
    path: string,
    data?: unknown,
    options?: ApiCallOptions
  ): Promise<ApiResult<T>> {
    const url = this.buildUrl(path);
    const { public: isPublic, ...guardOptions } = options ?? {};

    return withGuard(
      this.rawRequest<T>(url, {
        method: 'PUT',
        body: this.sanitize(data) as BodyInit,
      }, isPublic),
      {
        label: `PUT ${path}`,
        ...guardOptions,
      }
    ) as Promise<ApiResult<T>>;
  }

  /**
   * PATCH request
   */
  async patch<T>(
    path: string,
    data?: unknown,
    options?: ApiCallOptions
  ): Promise<ApiResult<T>> {
    const url = this.buildUrl(path);
    const { public: isPublic, ...guardOptions } = options ?? {};

    return withGuard(
      this.rawRequest<T>(url, {
        method: 'PATCH',
        body: this.sanitize(data) as BodyInit,
      }, isPublic),
      {
        label: `PATCH ${path}`,
        ...guardOptions,
      }
    ) as Promise<ApiResult<T>>;
  }

  /**
   * DELETE request
   */
  async delete<T>(
    path: string,
    options?: ApiCallOptions
  ): Promise<ApiResult<T>> {
    const url = this.buildUrl(path);
    const { public: isPublic, ...guardOptions } = options ?? {};

    return withGuard(
      this.rawRequest<T>(url, { method: 'DELETE' }, isPublic),
      {
        label: `DELETE ${path}`,
        ...guardOptions,
      }
    ) as Promise<ApiResult<T>>;
  }
}

/**
 * ============================================
 * API SERVICE
 * Single service for all NodeBB API calls
 * ============================================
 */
class ApiService extends ApiClient {
  private prefix = '/api';

  async get<T>(
    path: string,
    params?: PaginationParams,
    options?: ApiCallOptions
  ): Promise<ApiResult<T>> {
    return super.get<T>(`${this.prefix}${path}`, params, options);
  }

  async post<T>(
    path: string,
    data?: unknown,
    options?: ApiCallOptions
  ): Promise<ApiResult<T>> {
    return super.post<T>(`${this.prefix}${path}`, data, options);
  }

  async put<T>(
    path: string,
    data?: unknown,
    options?: ApiCallOptions
  ): Promise<ApiResult<T>> {
    return super.put<T>(`${this.prefix}${path}`, data, options);
  }

  async patch<T>(
    path: string,
    data?: unknown,
    options?: ApiCallOptions
  ): Promise<ApiResult<T>> {
    return super.patch<T>(`${this.prefix}${path}`, data, options);
  }

  async delete<T>(
    path: string,
    options?: ApiCallOptions
  ): Promise<ApiResult<T>> {
    return super.delete<T>(`${this.prefix}${path}`, options);
  }

  async download(path: string, fallbackFilename = 'download'): Promise<string> {
    return super.download(`${this.prefix}${path}`, fallbackFilename);
  }
}

/**
 * ============================================
 * EXPORTS
 * ============================================
 */
export const api = new ApiService();

export function setApiContext(key: string, value: string | null) {
  apiContext.set(key, value);
}

export function getApiContext(key: string): string | undefined {
  return apiContext.get(key);
}

export function clearApiContext() {
  apiContext.clear();
}

// Re-export guard utilities for convenience
export { 
  isError,
  getFieldError,
  getValidationErrors,
  isStatus,
  isValidationError,
  isRateLimited,
  isUnauthorized,
  isForbidden,
  isNotFound,
  formatDuration,
  ApiError,
} from '../managers/with-guard';

export type { GuardOptions } from '../managers/with-guard';

// Export rate limiter utilities for debugging
export { apiRateLimiter } from './rate-limiter';