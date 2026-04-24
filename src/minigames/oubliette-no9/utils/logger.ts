/**
 * Centralized logging utility with environment-based log levels
 * Automatically configures logging based on environment (verbose in dev, minimal in production)
 * 
 * @example
 * ```typescript
 * import { logger } from './utils/logger';
 * 
 * logger.debug('Verbose development info', { data });
 * logger.info('General information');
 * logger.warn('Warning message', error);
 * logger.error('Error occurred', error);
 * 
 * // Configure logging
 * logger.setLevel('warn'); // Only show warnings and errors
 * logger.setEnabled(false); // Disable all logging
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Logger class for centralized logging
 * Singleton instance exported as `logger`
 */
class Logger {
  private config: LoggerConfig;

  constructor() {
    // Configure based on environment
    this.config = {
      level: import.meta.env.MODE === 'production' ? 'warn' : 'debug',
      enabled: true,
    };
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  /**
   * Format log message with timestamp
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  /**
   * Debug log - verbose information for development
   */
  debug(message: string): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message));
    }
  }

  /**
   * Info log - general information
   */
  info(message: string): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message));
    }
  }

  /**
   * Warning log - recoverable issues
   */
  warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message));
    }
  }

  /**
   * Error log - serious issues
   */
  error(message: string, error?: Error): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), error);
    }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }
}

// Export singleton instance
export const logger = new Logger();
