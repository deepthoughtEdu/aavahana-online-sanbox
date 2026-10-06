/**
 * Security Utilities
 * 
 * Provides XSS protection and input sanitization utilities
 * as recommended in the Next.js Frontend Review Checklist (scan.md)
 */

/**
 * HTML entities that need to be escaped to prevent XSS attacks
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escapes HTML special characters to prevent XSS attacks
 * Use this when rendering user-generated content
 * 
 * @param str - String to escape
 * @returns Escaped string safe for HTML rendering
 * 
 * @example
 * ```ts
 * const userInput = '<script>alert("xss")</script>';
 * const safe = escapeHtml(userInput);
 * // Result: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
 * ```
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  return str.replace(/[&<>"'\/]/g, (match) => HTML_ENTITIES[match] || match);
}

/**
 * Strips HTML tags from a string
 * Useful for displaying plain text versions of HTML content
 * 
 * @param html - HTML string to strip
 * @returns Plain text without HTML tags
 * 
 * @example
 * ```ts
 * const html = '<p>Hello <strong>World</strong></p>';
 * const text = stripHtmlTags(html);
 * // Result: 'Hello World'
 * ```
 */
export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes a URL to prevent javascript: and data: URI XSS attacks
 * Only allows http:, https:, and mailto: protocols
 * 
 * @param url - URL to sanitize
 * @returns Sanitized URL or '#' if unsafe
 * 
 * @example
 * ```ts
 * sanitizeUrl('javascript:alert("xss")') // Returns: '#'
 * sanitizeUrl('https://example.com') // Returns: 'https://example.com'
 * ```
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '#';
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  // eslint-disable-next-line no-script-url -- This is a security check to BLOCK script URLs
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => trimmedUrl.startsWith(protocol))) {
    return '#';
  }
  
  // Allow safe protocols
  const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  if (safeProtocols.some(protocol => trimmedUrl.startsWith(protocol))) {
    return url.trim();
  }
  
  // Relative URLs are safe
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('.')) {
    return url.trim();
  }
  
  // Default to blocked
  return '#';
}

/**
 * Validates and sanitizes file names to prevent path traversal attacks
 * 
 * @param filename - Filename to sanitize
 * @returns Safe filename
 * 
 * @example
 * ```ts
 * sanitizeFilename('../../../etc/passwd') // Returns: 'etcpasswd'
 * sanitizeFilename('my-file.pdf') // Returns: 'my-file.pdf'
 * ```
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return 'unnamed';
  
  // Remove path traversal attempts and dangerous characters
  return filename
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .substring(0, 255); // Limit length
}

/**
 * Validates if a string contains only safe alphanumeric characters
 * Useful for validating IDs, slugs, etc.
 * 
 * @param str - String to validate
 * @param allowHyphen - Whether to allow hyphens (default: true)
 * @param allowUnderscore - Whether to allow underscores (default: true)
 * @returns True if string is safe
 * 
 * @example
 * ```ts
 * isSafeAlphanumeric('abc123') // true
 * isSafeAlphanumeric('user-id-123') // true
 * isSafeAlphanumeric('<script>') // false
 * ```
 */
export function isSafeAlphanumeric(
  str: string,
  allowHyphen = true,
  allowUnderscore = true
): boolean {
  if (!str || typeof str !== 'string') return false;
  
  let pattern = '^[a-zA-Z0-9';
  if (allowHyphen) pattern += '-';
  if (allowUnderscore) pattern += '_';
  pattern += ']+$';
  
  return new RegExp(pattern).test(str);
}

/**
 * Sanitizes search query input to prevent injection attacks
 * 
 * @param query - Search query to sanitize
 * @returns Sanitized query
 * 
 * @example
 * ```ts
 * sanitizeSearchQuery('<script>alert(1)</script>') // 'scriptalert1script'
 * ```
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  
  return query
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s-]/g, '') // Keep only alphanumeric, whitespace, and hyphens
    .trim()
    .substring(0, 200); // Limit length
}

/**
 * Validates Content Security Policy compliance
 * Checks if inline scripts or styles are being used unsafely
 * 
 * @param element - HTML string to check
 * @returns Array of CSP violations found
 */
export function checkCspCompliance(element: string): string[] {
  const violations: string[] = [];
  
  if (element.includes('onclick=') || element.includes('onerror=')) {
    violations.push('Inline event handlers detected');
  }
  
  if (element.includes('<script')) {
    violations.push('Inline script tag detected');
  }
  
  // eslint-disable-next-line no-script-url -- This is a security check to DETECT script URLs
  if (element.includes('javascript:')) {
    violations.push('JavaScript protocol in URL detected');
  }
  
  return violations;
}

/**
 * Rate limiting helper for client-side validation
 * Prevents abuse by limiting action frequency
 * 
 * @param key - Unique key for the action
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns True if action is allowed
 */
const rateLimitStore = new Map<string, number[]>();

export function clientRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const attempts = rateLimitStore.get(key) || [];
  
  // Clean old attempts
  const validAttempts = attempts.filter(time => now - time < windowMs);
  
  if (validAttempts.length >= maxAttempts) {
    return false;
  }
  
  validAttempts.push(now);
  rateLimitStore.set(key, validAttempts);
  
  return true;
}

/**
 * Validates JWT token format (basic check, not cryptographic validation)
 * Use this for client-side format validation only
 * 
 * @param token - JWT token to validate
 * @returns True if token has valid JWT format
 */
export function isValidJwtFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Security utility export object for convenience
 */
export const Security = {
  escapeHtml,
  stripHtmlTags,
  sanitizeUrl,
  sanitizeFilename,
  isSafeAlphanumeric,
  sanitizeSearchQuery,
  checkCspCompliance,
  clientRateLimit,
  isValidJwtFormat,
} as const;

export default Security;
