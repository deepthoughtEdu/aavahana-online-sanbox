/**
 * ============================================
 * UNIVERSAL LOGGER
 * Centralized logging system for the entire app
 * ============================================
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'performance';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: unknown;
  stack?: string;
  context?: Record<string, unknown>;
  user?: {
    uid?: number;
    username?: string;
  };
  // Performance specific
  duration?: number;
  label?: string;
  // Environment
  userAgent: string;
  url: string;
}

export interface LoggerConfig {
  // Log levels to enable
  enabledLevels: LogLevel[];
  // Whether to persist logs to localStorage
  persist: boolean;
  // Maximum logs to keep in memory
  maxLogs: number;
  // Whether to use external services (Sentry, etc.)
  useExternalServices: boolean;
}

/**
 * Sentry interface
 */
interface SentryInterface {
  captureException: (error: Error, options?: { extra?: Record<string, unknown> }) => void;
}

/**
 * Window with Sentry
 */
interface WindowWithSentry extends Window {
  Sentry?: SentryInterface;
}

class Logger {
  private logs: LogEntry[] = [];
  private listeners: Map<LogLevel | 'all', Array<(log: LogEntry) => void>> = new Map();
  private _persistTimer: ReturnType<typeof setTimeout> | null = null;
  private config: LoggerConfig = {
    enabledLevels: ['debug', 'info', 'warn', 'error', 'performance'],
    persist: true,
    maxLogs: 200,
    useExternalServices: false,
  };

  constructor() {
    // Load config from environment
    this.loadConfig();
    // Load persisted logs
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * Load configuration from environment
   */
  private loadConfig() {
    if (typeof window === 'undefined') return;

    const isDev = process.env.NODE_ENV === 'development';

    // Development: all logs enabled
    if (isDev) {
      this.config.enabledLevels = ['debug', 'info', 'warn', 'error', 'performance'];
      this.config.persist = true;
    } else {
      // Production: only important logs — Sentry handles error capture
      this.config.enabledLevels = ['warn', 'error'];
      this.config.persist = false;
      this.config.useExternalServices = true;
    }
  }

  /**
   * Update configuration
   */
  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Core logging method
   */
  private _log(level: LogLevel, message: string, data?: unknown, context?: Record<string, unknown>) {
    // Check if this level is enabled
    if (!this.config.enabledLevels.includes(level)) {
      return;
    }


    const entry = this.createLogEntry(level, message, data, context);
    
    // Store log
    this.logs.push(entry);
    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift(); // Remove oldest
    }

    // Persist to storage
    if (this.config.persist) {
      this.persistToStorage();
    }

    // Console output (formatted)
    this.consoleOutput(entry);

    // Notify listeners
    this.notifyListeners(entry);

    // Send to external services (Sentry in production)
    if (this.config.useExternalServices) {
      this.sendToExternalServices(entry);
    }

    return entry;
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: Record<string, unknown>
  ): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      message,
      data,
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    };

    // Add stack trace for errors
    if (level === 'error' && data instanceof Error) {
      entry.stack = data.stack;
    }

    // Add user data if available
    const user = this.getCurrentUser();
    if (user) {
      entry.user = user;
    }

    return entry;
  }

  /**
   * Console output with formatting
   */
  private consoleOutput(entry: LogEntry) {
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '🔴',
      performance: '⚡',
    };

    const color = {
      debug: 'color: #888',
      info: 'color: #0ea5e9',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
      performance: 'color: #8b5cf6',
    };
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();

    console.log(
      `%c${emoji[entry.level]} [${entry.level.toUpperCase()}] ${timestamp} - ${entry.message}`,
      color[entry.level],
      entry.data || '',
      entry.context || ''
    );
  }

  /**
   * Notify listeners
   */
  private notifyListeners(entry: LogEntry) {
    // Notify level-specific listeners
    const levelListeners = this.listeners.get(entry.level) || [];
    levelListeners.forEach(callback => {
      try {
        callback(entry);
      } catch {
        // Ignore listener errors
      }
    });

    // Notify 'all' listeners
    const allListeners = this.listeners.get('all') || [];
    allListeners.forEach(callback => {
      try {
        callback(entry);
      } catch {
        // Ignore listener errors
      }
    });
  }

  /**
   * Send to external services
   */
  private sendToExternalServices(entry: LogEntry) {
    // ✅ Fixed: Properly typed Sentry check
    if (this.config.useExternalServices && typeof window !== 'undefined') {
      const windowWithSentry = window as WindowWithSentry;
      
      if (windowWithSentry.Sentry && entry.level === 'error') {
        const error = entry.data instanceof Error ? entry.data : new Error(entry.message);
        windowWithSentry.Sentry.captureException(error, {
          extra: {
            ...entry.context,
            logEntry: entry,
          },
        });
      }
    }

  }

  /**
   * ============================================
   * PUBLIC API - LOG METHODS
   * ============================================
   */

  debug(message: string, data?: unknown, context?: Record<string, unknown>) {
    return this._log('debug', message, data, context);
  }

  info(message: string, data?: unknown, context?: Record<string, unknown>) {
    return this._log('info', message, data, context);
  }

  warn(message: string, data?: unknown, context?: Record<string, unknown>) {
    return this._log('warn', message, data, context);
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    return this._log('error', message, error, context);
  }

  performance(label: string, duration: number, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('performance', label, { duration }, context);
    entry.duration = duration;
    entry.label = label;

    this.logs.push(entry);
    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift();
    }

    if (this.config.persist) {
      this.persistToStorage();
    }

    // Color-coded performance log
    const color = duration < 100 ? '🟢' : duration < 500 ? '🟡' : duration < 1000 ? '🟠' : '🔴';
    console.log(
      `${color} [PERFORMANCE] ${label}: ${this.formatDuration(duration)}`,
      context || ''
    );

    this.notifyListeners(entry);

    return entry;
  }

  /**
   * ============================================
   * CONVENIENCE METHODS
   * ============================================
   */

  /**
   * General console.log replacement
   * Logs anything without creating a log entry - just forwards to console.log
   */
  log(...args: unknown[]) {
    console.log(...args);
  }

  /**
   * Pretty print - formatted JSON output
   */
  pretty(data: unknown, label?: string) {
    if (label) {
      console.log(`📋 ${label}:`);
    }
    if (typeof data === 'object' && data !== null) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }

  /**
   * ============================================
   * GROUPED LOGGING
   * ============================================
   */

  group(label: string) {
    console.group(`📦 ${label}`);
    return {
      debug: (msg: string, data?: unknown) => this.debug(msg, data, { group: label }),
      info: (msg: string, data?: unknown) => this.info(msg, data, { group: label }),
      warn: (msg: string, data?: unknown) => this.warn(msg, data, { group: label }),
      error: (msg: string, err?: unknown) => this.error(msg, err, { group: label }),
      end: () => console.groupEnd(),
    };
  }

  /**
   * ============================================
   * TIMING UTILITIES
   * ============================================
   */

  time(label: string) {
    const startTime = performance.now();
    const startTimestamp = Date.now();
    
    return {
      end: (context?: Record<string, unknown>) => {
        const duration = performance.now() - startTime;
        return this.performance(label, duration, {
          ...context,
          timestamp: startTimestamp,
        });
      },
    };
  }

  /**
   * ============================================
   * QUERY & FILTER
   * ============================================
   */

  getLogs(filter?: {
    level?: LogLevel;
    since?: number;
    until?: number;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filter?.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }

    if (filter?.since) {
      filtered = filtered.filter(log => log.timestamp >= (filter.since || 0));
    }

    if (filter?.until) {
      filtered = filtered.filter(log => log.timestamp <= (filter.until || 0));
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  getErrors(): LogEntry[] {
    return this.logs.filter(log => log.level === 'error');
  }

  getWarnings(): LogEntry[] {
    return this.logs.filter(log => log.level === 'warn');
  }

  getPerformanceLogs(): LogEntry[] {
    return this.logs.filter(log => log.level === 'performance');
  }

  /**
   * ============================================
   * STATISTICS
   * ============================================
   */

  getStats() {
    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);

    const performanceLogs = this.getPerformanceLogs();
    const avgDuration = performanceLogs.length
      ? performanceLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / performanceLogs.length
      : 0;

    return {
      total: this.logs.length,
      byLevel,
      errors: this.getErrors().length,
      warnings: this.getWarnings().length,
      averagePerformance: avgDuration,
      mostRecent: this.logs[this.logs.length - 1],
    };
  }

  /**
   * ============================================
   * LISTENERS
   * ============================================
   */

  on(level: LogLevel | 'all', callback: (log: LogEntry) => void) {
    if (!this.listeners.has(level)) {
      this.listeners.set(level, []);
    }
    this.listeners.get(level)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(level);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * ============================================
   * PERSISTENCE
   * ============================================
   */

  private persistToStorage() {
    // Debounce: write at most once per 2 seconds to avoid thrashing localStorage
    if (this._persistTimer !== null) return;
    this._persistTimer = setTimeout(() => {
      this._persistTimer = null;
      try {
        const recentLogs = this.logs.slice(-50);
        localStorage.setItem('app-logs', JSON.stringify(recentLogs));
      } catch {
        // Ignore storage errors
      }
    }, 2000);
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('app-logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * ============================================
   * EXPORT
   * ============================================
   */

  export(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    // CSV format
    const headers = ['Timestamp', 'Level', 'Message', 'Data', 'Context'];
    const rows = this.logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.level,
      log.message,
      JSON.stringify(log.data || ''),
      JSON.stringify(log.context || ''),
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  }

  download(filename?: string, format: 'json' | 'csv' = 'json') {
    const data = this.export(format);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `logs-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * ============================================
   * UTILITIES
   * ============================================
   */

  clear() {
    this.logs = [];
    try {
      localStorage.removeItem('app-logs');
    } catch {
      // Ignore
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUser() {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch {
      // Ignore
    }
    return undefined;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }
    if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${(ms / 60000).toFixed(2)}m`;
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports
export const log = {
  debug: (msg: string, data?: unknown, ctx?: Record<string, unknown>) => logger.debug(msg, data, ctx),
  info: (msg: string, data?: unknown, ctx?: Record<string, unknown>) => logger.info(msg, data, ctx),
  warn: (msg: string, data?: unknown, ctx?: Record<string, unknown>) => logger.warn(msg, data, ctx),
  error: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => logger.error(msg, err, ctx),
  perf: (label: string, duration: number, ctx?: Record<string, unknown>) => logger.performance(label, duration, ctx),
  group: (label: string) => logger.group(label),
  time: (label: string) => logger.time(label),
  log: (...args: unknown[]) => logger.log(...args),
  pretty: (data: unknown, label?: string) => logger.pretty(data, label),
};