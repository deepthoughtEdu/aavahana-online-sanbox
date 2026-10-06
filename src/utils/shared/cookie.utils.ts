// src/utils/cookie.ts
import { NextRequest } from "next/server";
import { COOKIE_MAPS, COOKIE_MAPS_REVERSE } from "@/config/constants";
import { logger } from "@/lib/managers/logger";

/**
 * Map frontend cookie names to backend cookie names for forwarding
 */
export function mapCookiesForward(req: NextRequest): string {
  const cookies = req.cookies.getAll();
  return cookies
    .map(({ name, value }) => {
      const beKey = COOKIE_MAPS[name] || name; // fallback to original name
      return `${beKey}=${value}`;
    })
    .join("; ");
}

/**
 * Map backend cookie names to frontend cookie names in Set-Cookie headers
 */
export function mapCookiesReverse(setCookieHeaders: string[]): string[] {
  return setCookieHeaders.map((cookieStr) => {
    let out = cookieStr;
    Object.entries(COOKIE_MAPS_REVERSE).forEach(([beKey, feKey]) => {
      out = out.replace(new RegExp(`^${beKey}=`), `${feKey}=`);
    });
    return out;
  });
}

/**
 *  Check if session cookie exists (handles both mapped and unmapped names)
 */
export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;

  // auth-refactor Step 4: the `|| localStorage.getItem('verified')` fallback was
  // removed. Session presence is no longer inferred from a client-readable flag —
  // the single source of truth is the server-verified /api/auth/session query
  // (see use-auth.ts). express.sid is HttpOnly, so this document.cookie scan can
  // never see it; this helper is retained only for non-auth callers and must NOT
  // be used to gate authentication.
  const cookies = document.cookie.split(';');
  return cookies.some(cookie => {
    const [name] = cookie.trim().split('=');
    return name === 'session' || name === 'express.sid' || name in COOKIE_MAPS;
  });
}

/**
 *  Clear all cookies (improved to handle all domains and paths)
 */
export function clearAllCookies(): void {
  if (typeof document === 'undefined') return;
  
  const cookies = document.cookie.split(';');
  const hostname = window.location.hostname;
  const domain = hostname.startsWith('www.') ? hostname.substring(4) : hostname;
  
  cookies.forEach(cookie => {
    const [name] = cookie.trim().split('=');
    
    // Clear for multiple path/domain combinations
    const clearOptions = [
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`,
    ];
    
    clearOptions.forEach(option => {
      document.cookie = option;
    });
  });
  
  //  Also clear localStorage/sessionStorage
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    logger.warn('Could not clear storage', e);
  }
}

/**
 * Get cookie value by name (handles both mapped and unmapped names)
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  
  // Check for both frontend and backend cookie names
  const possibleNames = [name, COOKIE_MAPS[name]].filter(Boolean);
  
  const cookie = cookies.find(c => {
    const [cookieName] = c.trim().split('=');
    return possibleNames.includes(cookieName);
  });
  
  if (!cookie) return null;
  
  const [, value] = cookie.trim().split('=');
  return decodeURIComponent(value);
}

/**
 * Set cookie with proper configuration
 */
export function setCookie(name: string, value: string, options: {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
} = {}): void {
  if (typeof document === 'undefined') return;
  
  const {
    days = 7,
    path = '/',
    domain,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'Lax',
  } = options;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  let cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}; SameSite=${sameSite}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  if (secure) {
    cookieString += '; Secure';
  }
  
  document.cookie = cookieString;
}

/**
 *  Delete a specific cookie
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  setCookie(name, '', { days: -1 });
  
  // Also try with domain variants
  const hostname = window.location.hostname;
  const domain = hostname.startsWith('www.') ? hostname.substring(4) : hostname;
  
  setCookie(name, '', { days: -1, domain: hostname });
  setCookie(name, '', { days: -1, domain: domain });
  setCookie(name, '', { days: -1, domain: `.${domain}` });
}