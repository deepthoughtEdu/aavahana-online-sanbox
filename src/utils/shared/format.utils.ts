// src/lib/utils/format.ts

// ==========================
// NUMBER FORMATTING
// ==========================

export function formatNumber(num?: number): string {
  if (num == null || isNaN(num)) return '-';
  return num.toLocaleString('en-US');
}

export function formatCompactNumber(num: number): string {
  if (num < 1000) return num.toString();
  const format = (n: number, suffix: string) =>
    parseFloat(n.toFixed(1)).toString().replace(/\.0$/, '') + suffix;

  if (num < 1_000_000) return format(num / 1_000, 'K');
  if (num < 1_000_000_000) return format(num / 1_000_000, 'M');
  return format(num / 1_000_000_000, 'B');
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// ==========================
// STRING FORMATTING
// ==========================

export function truncate(str = '', maxLength: number): string {
  return str.length <= maxLength ? str : `${str.slice(0, maxLength)}...`;
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

export function humanize(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// ==========================
// FILE SIZE FORMATTING
// ==========================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ==========================
// PHONE NUMBER FORMATTING
// ==========================

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// ==========================
// COLOR UTILITIES
// ==========================

export function stringToColor(str: string): string {
  if (!str) return 'hsl(0, 0%, 70%)';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

// ==========================
// PATH UTILITIES
// ==========================

export function resolveDynamicPath(
  path: string,
  context: Record<string, unknown>
): string {
  if (!path) return path;

  return path.replace(/:([a-zA-Z_][\w]*)\.([a-zA-Z0-9_.\[\]]+)/g, (_, ctxKey, propertyPath) => {
    const contextData = context[ctxKey];
    if (!contextData) return `:${ctxKey}.${propertyPath}`;

    const value = getNestedProperty(contextData as Record<string, unknown>, propertyPath);
    return value !== undefined && value !== null
      ? String(value)
      : `:${ctxKey}.${propertyPath}`;
  });
}

function getNestedProperty(obj: Record<string, unknown>, path: string): unknown {
  if (!obj || !path) return undefined;

  return path.split('.').reduce<unknown>((current, key) => {
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch;
      const arr = (current as Record<string, unknown>)[arrayKey];
      return Array.isArray(arr) ? arr[Number(index)] : undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, obj);
}


/**
 * ============================================
 * SANITIZATION UTILITIES
 * ============================================
 * Helper functions to sanitize user input before sending to API
 */

/**
 * Sanitize email address
 * - Trims whitespace
 * - Converts to lowercase
 * 
 * @param email - Raw email input
 * @returns Sanitized email
 * 
 * @example
 * sanitizeEmail("  John.Doe@Example.COM  ") // "john.doe@example.com"
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Strip ALL whitespace (not just leading/trailing) and lowercase. Used for
 * live-normalisation in email inputs so users can't accidentally include
 * spaces — even pasted "  Tarun @Example.com" becomes "tarun@example.com".
 *
 * @example
 * stripEmailWhitespace("  John . Doe@ Example.COM  ") // "john.doe@example.com"
 */
export function stripEmailWhitespace(email: string): string {
  return email.replace(/\s+/g, "").toLowerCase();
}

/**
 * Collapse runs of internal whitespace to a single space and trim ends.
 * Suitable for human names ("Tarun  Kumar  " → "Tarun Kumar"). Does NOT
 * lowercase — names are case-significant.
 */
export function normalizeFullName(name: string): string {
  return name.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
}

/**
 * Sanitize username for registration
 * - Extracts username from email (before @)
 * - Converts to lowercase
 * - Replaces invalid characters with underscores
 * - Limits to 20 characters (NodeBB requirement)
 * - Removes leading/trailing underscores and hyphens
 * 
 * Valid characters: letters (a-z), numbers (0-9), hyphens (-), underscores (_)
 * 
 * @param email - Email address to generate username from
 * @returns Sanitized username (max 20 chars)
 * 
 * @example
 * generateUsername("john.doe@example.com") // "john_doe"
 * generateUsername("user+test@example.com") // "user_test"
 * generateUsername("very.long.email.address@example.com") // "very_long_email_addr"
 */
export function generateUsername(email: string): string {
  const emailUsername = email.split("@")[0];
  
  return emailUsername
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_') // Replace invalid chars with underscore
    .slice(0, 20) // Limit to 20 characters (NodeBB max)
    .replace(/^[_-]+|[_-]+$/g, ''); // Remove leading/trailing underscores/hyphens
}

/**
 * Sanitize username input (when user provides their own username)
 * - Trims whitespace
 * - Converts to lowercase
 * - Replaces invalid characters with underscores
 * - Limits to 20 characters
 * 
 * @param username - Raw username input
 * @returns Sanitized username
 * 
 * @example
 * sanitizeUsername("  John_Doe-123  ") // "john_doe-123"
 * sanitizeUsername("user@name!") // "user_name_"
 */
export function sanitizeUsername(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 20)
    .replace(/^[_-]+|[_-]+$/g, '');
}

/**
 * Validate username format (client-side check)
 * Returns true if username meets NodeBB requirements
 * 
 * @param username - Username to validate
 * @returns true if valid, false otherwise
 * 
 * @example
 * isValidUsername("john_doe") // true
 * isValidUsername("user@name") // false
 * isValidUsername("ab") // false (too short)
 */
export function isValidUsername(username: string): boolean {
  if (!username || username.length < 3 || username.length > 20) {
    return false;
  }
  
  // Only letters, numbers, hyphens, underscores
  return /^[a-z0-9_-]+$/i.test(username);
}

/**
 * Sanitize full name
 * - Trims whitespace
 * - Removes extra spaces between words
 * - Capitalizes first letter of each word
 * 
 * @param fullName - Raw full name input
 * @returns Sanitized full name
 * 
 * @example
 * sanitizeFullName("  john   doe  ") // "John Doe"
 * sanitizeFullName("mary-jane watson") // "Mary-Jane Watson"
 */
export function sanitizeFullName(fullName: string): string {
  return fullName
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Trim password (remove leading/trailing whitespace only)
 * Note: We don't lowercase or modify password content
 * 
 * @param password - Raw password input
 * @returns Trimmed password
 */
export function sanitizePassword(password: string): string {
  return password.trim();
}