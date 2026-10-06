import { logger } from '@/lib/managers/logger';

interface RateLimitConfig {
  maxRequests: number;      // Max requests allowed in the time window
  windowMs: number;          // Time window in milliseconds
  keyPrefix?: string;        // Optional prefix for different rate limit groups
}

interface RequestLog {
  timestamp: number;
  url: string;
  method: string;
  status: 'success' | 'blocked' | 'error';
  message?: string;
}

interface RateLimitStats {
  endpoint: string;
  method: string;
  count: number;
  firstRequest: string;
  lastRequest: string;
  blocked: number;
}

interface ErrorWithStatus {
  message?: string;
  status?: number;
  statusCode?: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private logs: RequestLog[] = [];
  private config: RateLimitConfig;
  private maxLogs: number = 100; // Keep last 100 logs
  private isClient: boolean;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyPrefix: 'default',
      ...config,
    };
    
    // Check if running on client
    this.isClient = typeof window !== 'undefined';
    
    // ✅ Log initialization with logger
    if (this.isClient && process.env.NODE_ENV === 'development') {
      logger.info('Rate Limiter initialized', {
        maxRequests: this.config.maxRequests,
        windowMs: this.config.windowMs,
        keyPrefix: this.config.keyPrefix,
      });
    }
  }

  /**
   * Generate a unique key for rate limiting
   */
  private getKey(url: string, method: string): string {
    // Extract endpoint from URL (remove query params and domain)
    const urlObj = new URL(url, this.isClient ? window.location.origin : 'http://localhost');
    const endpoint = urlObj.pathname;
    return `${this.config.keyPrefix}:${method}:${endpoint}`;
  }

  /**
   * Clean up old requests outside the time window
   */
  private cleanupOldRequests(key: string): void {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );
    
    if (validTimestamps.length > 0) {
      this.requests.set(key, validTimestamps);
    } else {
      this.requests.delete(key);
    }
  }

  /**
   * Check if request is allowed
   */
  public async checkLimit(url: string, method: string): Promise<boolean> {
    // Skip rate limiting on server-side
    if (!this.isClient) {
      return true;
    }

    const key = this.getKey(url, method);
    this.cleanupOldRequests(key);

    const timestamps = this.requests.get(key) || [];
    const requestCount = timestamps.length;

    if (requestCount >= this.config.maxRequests) {
      // ✅ Request blocked - log with logger
      const message = `Rate limit exceeded: ${requestCount}/${this.config.maxRequests} requests in ${this.config.windowMs}ms`;
      
      this.logRequest(url, method, 'blocked', message);
      
      logger.warn('Rate Limit Exceeded', {
        url,
        method,
        requestCount,
        maxRequests: this.config.maxRequests,
        windowMs: this.config.windowMs,
      });
      
      return false;
    }

    // Request allowed
    timestamps.push(Date.now());
    this.requests.set(key, timestamps);
    this.logRequest(url, method, 'success');
    return true;
  }

  /**
   * Log request error (including 404s and other errors)
   */
  public logError(url: string, method: string, error: unknown): void {
    if (!this.isClient) return;

    const err = error as ErrorWithStatus;
    const message = err?.message || 'Unknown error';
    const status = err?.status || err?.statusCode;
    
    const errorMessage = `${status ? `[${status}] ` : ''}${message}`;
    
    this.logRequest(url, method, 'error', errorMessage);
    
    // ✅ Log with logger
    logger.error('API Request Error', error, {
      url,
      method,
      status,
    });
  }

  /**
   * Log request attempt
   */
  private logRequest(
    url: string,
    method: string,
    status: 'success' | 'blocked' | 'error',
    message?: string
  ): void {
    if (!this.isClient) return;

    const log: RequestLog = {
      timestamp: Date.now(),
      url,
      method,
      status,
      message,
    };

    this.logs.push(log);

    // Keep only the last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Get current statistics
   */
  public getStats(): RateLimitStats[] {
    if (!this.isClient) return [];

    const statsMap = new Map<string, RateLimitStats>();

    this.logs.forEach((log) => {
      const urlObj = new URL(log.url, window.location.origin);
      const endpoint = urlObj.pathname;
      const key = `${log.method}:${endpoint}`;

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          endpoint,
          method: log.method,
          count: 0,
          firstRequest: new Date(log.timestamp).toLocaleTimeString(),
          lastRequest: new Date(log.timestamp).toLocaleTimeString(),
          blocked: 0,
        });
      }

      const stats = statsMap.get(key)!;
      stats.count++;
      stats.lastRequest = new Date(log.timestamp).toLocaleTimeString();
      
      if (log.status === 'blocked') {
        stats.blocked++;
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
  }

  /**
   * Print statistics to console as a table
   */
  public printStats(): void {
    if (!this.isClient) {
      logger.warn('Rate limiter stats are only available on the client side');
      return;
    }

    const stats = this.getStats();
    
    if (stats.length === 0) {
      logger.info('No API requests logged yet');
      return;
    }

    // Use logger to display statistics
    logger.debug('API Rate Limiter Statistics', {
      stats: stats.map(stat => ({
        'Endpoint': stat.endpoint,
        'Method': stat.method,
        'Total Requests': stat.count,
        'Blocked': stat.blocked,
        'First Request': stat.firstRequest,
        'Last Request': stat.lastRequest,
      }))
    });

    // ✅ Log summary with logger
    const totalRequests = stats.reduce((sum, s) => sum + s.count, 0);
    const totalBlocked = stats.reduce((sum, s) => sum + s.blocked, 0);
    const successRate = ((totalRequests - totalBlocked) / totalRequests * 100).toFixed(2);
    
    logger.info('Rate Limiter Summary', {
      totalRequests,
      totalBlocked,
      successRate: `${successRate}%`,
      config: `${this.config.maxRequests} requests per ${this.config.windowMs}ms`,
    });
  }

  /**
   * Print recent logs
   */
  public printLogs(count: number = 20): void {
    if (!this.isClient) {
      logger.warn('Rate limiter logs are only available on the client side');
      return;
    }

    const recentLogs = this.logs.slice(-count);
    
    if (recentLogs.length === 0) {
      logger.info('No logs available');
      return;
    }

    // Use logger to display logs
    logger.debug(`Last ${recentLogs.length} API Requests`, {
      logs: recentLogs.map((log) => {
        const urlObj = new URL(log.url, window.location.origin);
        return {
          'Time': new Date(log.timestamp).toLocaleTimeString(),
          'Status': log.status === 'blocked' ? 'BLOCKED' : log.status === 'error' ? 'ERROR' : 'OK',
          'Method': log.method,
          'Endpoint': urlObj.pathname,
          'Message': log.message || '-',
        };
      })
    });
  }

  /**
   * Clear all statistics and logs
   */
  public clear(): void {
    if (!this.isClient) return;

    this.requests.clear();
    this.logs = [];
    
    // ✅ Log with logger
    logger.info('Rate limiter cleared');
  }

  /**
   * Get time until rate limit resets for a specific endpoint
   */
  public getTimeUntilReset(url: string, method: string): number {
    if (!this.isClient) return 0;

    const key = this.getKey(url, method);
    const timestamps = this.requests.get(key) || [];
    
    if (timestamps.length === 0) {
      return 0;
    }

    const oldestTimestamp = Math.min(...timestamps);
    const resetTime = oldestTimestamp + this.config.windowMs;
    const timeUntilReset = Math.max(0, resetTime - Date.now());
    
    return timeUntilReset;
  }

  /**
   * Check if a specific endpoint is currently rate limited
   */
  public isRateLimited(url: string, method: string): boolean {
    if (!this.isClient) return false;

    const key = this.getKey(url, method);
    this.cleanupOldRequests(key);
    const timestamps = this.requests.get(key) || [];
    return timestamps.length >= this.config.maxRequests;
  }
}

// Create a default rate limiter instance
// 5 requests per 10 seconds per endpoint (strict limit to catch loops quickly)
export const apiRateLimiter = new RateLimiter({
  // Writes only (client.ts exempts GET). Ten per ten seconds to one path: a person cannot press
  // that fast on purpose, and a cross-then-undo pair on the dialler fits comfortably.
  maxRequests: 10,
  windowMs: 10000, // 10 seconds
  keyPrefix: 'api',
});

// Make it accessible from browser console for debugging (client-side only)
if (typeof window !== 'undefined') {
  (window as Window & { apiRateLimiter?: unknown }).apiRateLimiter = {
    stats: () => apiRateLimiter.printStats(),
    logs: (count?: number) => apiRateLimiter.printLogs(count),
    clear: () => apiRateLimiter.clear(),
    isLimited: (url: string, method: string = 'GET') => 
      apiRateLimiter.isRateLimited(url, method),
  };

}

export default RateLimiter;