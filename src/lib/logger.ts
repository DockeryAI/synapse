/**
 * Application Logger Utility
 *
 * Structured logging with levels, namespaces, and filtering.
 * Solves the "10,000 console messages" problem during development.
 *
 * Features:
 * - Log levels: ERROR, WARN, INFO, DEBUG, TRACE
 * - Service namespaces for filtering
 * - Environment-based controls
 * - Operation grouping
 * - Rate limiting for repetitive logs
 * - Object inspection helpers
 *
 * Usage:
 * ```typescript
 * const log = createLogger('ProductExtractor');
 * log.info('Starting extraction', { pages: 3 });
 * log.debug('API response:', data);
 * log.error('Extraction failed', error);
 * ```
 *
 * Environment Controls:
 * - VITE_LOG_LEVEL=error|warn|info|debug|trace (default: info)
 * - VITE_LOG_NAMESPACES=ProductExtractor,BuyerIntel (comma-separated, or * for all)
 * - VITE_ENABLE_LOGS=true|false (master switch)
 *
 * Created: 2025-11-18
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface LoggerConfig {
  level: LogLevel;
  enabledNamespaces: string[] | '*';
  enabled: boolean;
  groupOperations: boolean;
}

// Log level hierarchy (lower number = higher priority)
const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

// Rate limiting cache (prevent spamming same message)
const messageCache = new Map<string, { count: number; lastLogged: number }>();
const RATE_LIMIT_MS = 1000; // Don't log same message more than once per second

/**
 * Get logger configuration from environment
 */
function getLoggerConfig(): LoggerConfig {
  const env = import.meta?.env || process.env;

  const enabled = env.VITE_ENABLE_LOGS !== 'false'; // Enabled by default
  const level = (env.VITE_LOG_LEVEL as LogLevel) || 'info';

  const namespacesEnv = env.VITE_LOG_NAMESPACES || '*';
  const enabledNamespaces =
    namespacesEnv === '*' ? '*' : namespacesEnv.split(',').map((ns: string) => ns.trim());

  return {
    level,
    enabledNamespaces,
    enabled,
    groupOperations: true, // Always group related logs
  };
}

const config = getLoggerConfig();

/**
 * Logger class for a specific namespace (service)
 */
export class Logger {
  constructor(private namespace: string) {}

  /**
   * Check if this logger should output at given level
   */
  private shouldLog(level: LogLevel): boolean {
    if (!config.enabled) return false;

    // Check namespace filter
    if (config.enabledNamespaces !== '*') {
      const namespaceMatches = config.enabledNamespaces.some(
        (ns) => this.namespace.includes(ns) || ns.includes(this.namespace)
      );
      if (!namespaceMatches) return false;
    }

    // Check log level
    return LOG_LEVELS[level] <= LOG_LEVELS[config.level];
  }

  /**
   * Format log message with namespace and emoji
   */
  private format(level: LogLevel, args: any[]): any[] {
    const emoji = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍',
      trace: '📝',
    };

    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const prefix = `[${timestamp}] ${emoji[level]} [${this.namespace}]`;

    return [prefix, ...args];
  }

  /**
   * Check if message should be rate limited
   */
  private isRateLimited(message: string): boolean {
    const key = `${this.namespace}:${message}`;
    const now = Date.now();
    const cached = messageCache.get(key);

    if (cached && now - cached.lastLogged < RATE_LIMIT_MS) {
      cached.count++;
      return true;
    }

    messageCache.set(key, { count: 1, lastLogged: now });
    return false;
  }

  /**
   * ERROR: Critical errors that break functionality
   */
  error(...args: any[]): void {
    if (!this.shouldLog('error')) return;

    const formatted = this.format('error', args);
    console.error(...formatted);

    // Always log stack trace for errors
    if (args[0] instanceof Error) {
      console.error('Stack:', args[0].stack);
    }
  }

  /**
   * WARN: Warnings that don't break functionality but are concerning
   */
  warn(...args: any[]): void {
    if (!this.shouldLog('warn')) return;

    const formatted = this.format('warn', args);
    console.warn(...formatted);
  }

  /**
   * INFO: Important high-level operations (default level)
   */
  info(...args: any[]): void {
    if (!this.shouldLog('info')) return;

    const message = typeof args[0] === 'string' ? args[0] : '';
    if (this.isRateLimited(message)) return;

    const formatted = this.format('info', args);
    console.log(...formatted);
  }

  /**
   * DEBUG: Detailed information for debugging
   */
  debug(...args: any[]): void {
    if (!this.shouldLog('debug')) return;

    const message = typeof args[0] === 'string' ? args[0] : '';
    if (this.isRateLimited(message)) return;

    const formatted = this.format('debug', args);
    console.log(...formatted);
  }

  /**
   * TRACE: Very verbose logging (use sparingly)
   */
  trace(...args: any[]): void {
    if (!this.shouldLog('trace')) return;

    const formatted = this.format('trace', args);
    console.log(...formatted);
  }

  /**
   * Group related operations together
   * Auto-collapses if successful, stays open if error
   */
  async group<T>(
    label: string,
    operation: () => T | Promise<T>,
    options: { collapsed?: boolean } = {}
  ): Promise<T> {
    if (!this.shouldLog('info')) {
      // If logging disabled, just run the operation
      return operation();
    }

    const startTime = Date.now();
    const groupLabel = `[${this.namespace}] ${label}`;

    try {
      if (options.collapsed !== false && config.groupOperations) {
        console.groupCollapsed(groupLabel);
      } else {
        console.group(groupLabel);
      }

      const result = await operation();

      const duration = Date.now() - startTime;
      this.debug(`✅ Completed in ${duration}ms`);

      console.groupEnd();
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`❌ Failed after ${duration}ms:`, error);

      // Keep group open on error for debugging
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Time an operation and log duration
   */
  time(label: string): () => void {
    if (!this.shouldLog('debug')) {
      return () => {}; // No-op
    }

    const startTime = Date.now();
    const timerLabel = `[${this.namespace}] ${label}`;
    console.time(timerLabel);

    return () => {
      console.timeEnd(timerLabel);
      const duration = Date.now() - startTime;
      this.debug(`${label}: ${duration}ms`);
    };
  }

  /**
   * Log a table (useful for arrays of objects)
   */
  table(data: any[], label?: string): void {
    if (!this.shouldLog('debug')) return;

    if (label) {
      this.debug(label);
    }
    console.table(data);
  }

  /**
   * Inspect an object (pretty print)
   */
  inspect(obj: any, label?: string): void {
    if (!this.shouldLog('debug')) return;

    if (label) {
      this.debug(label);
    }
    console.dir(obj, { depth: 3, colors: true });
  }
}

/**
 * Create a logger for a specific namespace/service
 */
export function createLogger(namespace: string): Logger {
  return new Logger(namespace);
}

/**
 * Set log level dynamically (useful for debugging)
 */
export function setLogLevel(level: LogLevel): void {
  config.level = level;
  console.log(`📊 Log level set to: ${level}`);
}

/**
 * Enable/disable logging dynamically
 */
export function setLoggingEnabled(enabled: boolean): void {
  config.enabled = enabled;
  console.log(`📊 Logging ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Filter logs by namespace
 */
export function setLogNamespaces(namespaces: string[] | '*'): void {
  config.enabledNamespaces = namespaces;
  console.log(`📊 Log namespaces: ${namespaces}`);
}

/**
 * Clear rate limit cache (if logs are being suppressed)
 */
export function clearRateLimitCache(): void {
  messageCache.clear();
  console.log('📊 Rate limit cache cleared');
}

/**
 * Print current logger configuration
 */
export function printLogConfig(): void {
  console.group('📊 Logger Configuration');
  console.log('Enabled:', config.enabled);
  console.log('Level:', config.level);
  console.log('Namespaces:', config.enabledNamespaces);
  console.log('Group Operations:', config.groupOperations);
  console.groupEnd();
}

/**
 * Convenience: Create loggers for common services
 */
export const loggers = {
  productExtractor: createLogger('ProductExtractor'),
  buyerIntel: createLogger('BuyerIntelligence'),
  uvpFlow: createLogger('UVPFlow'),
  dataCollection: createLogger('DataCollection'),
  deepScanner: createLogger('DeepScanner'),
  onboarding: createLogger('Onboarding'),
  api: createLogger('API'),
};

// Export default logger for quick use
export default createLogger('App');

// Expose logger utilities on window for debugging
if (typeof window !== 'undefined') {
  (window as any).__logger = {
    setLogLevel,
    setLoggingEnabled,
    setLogNamespaces,
    clearRateLimitCache,
    printLogConfig,
    loggers,
  };

  // Print helpful message
  if (config.enabled) {
    console.log(
      '%c📊 Logger Initialized',
      'background: #7c3aed; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
    );
    console.log('💡 Control logging via window.__logger (try window.__logger.printLogConfig())');
    console.log('💡 Set env vars: VITE_LOG_LEVEL, VITE_LOG_NAMESPACES, VITE_ENABLE_LOGS');
  }
}
