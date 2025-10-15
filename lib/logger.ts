/**
 * Centralized logging utility for the application
 * In production, this can be extended to integrate with services like Sentry, LogRocket, etc.
 */

const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  /**
   * Log an error with context
   * @param message - Error message
   * @param error - Error object or additional context
   */
  error: (message: string, error?: any) => {
    if (isProd) {
      // In production, you could send to error tracking service
      console.error(`[ERROR] ${message}`, error);
      // TODO: Send to Sentry/LogRocket
    } else {
      console.error(`[ERROR] ${message}`, error);
    }
  },

  /**
   * Log a warning
   * @param message - Warning message
   * @param data - Additional context data
   */
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },

  /**
   * Log informational message (development only)
   * @param message - Info message
   * @param data - Additional context data
   */
  info: (message: string, data?: any) => {
    if (!isProd) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },

  /**
   * Log debug message (development only)
   * @param message - Debug message
   * @param data - Additional context data
   */
  debug: (message: string, data?: any) => {
    if (!isProd) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },

  /**
   * Log API request with timing
   * @param method - HTTP method
   * @param path - API path
   * @param duration - Request duration in ms
   * @param status - Response status code
   */
  apiRequest: (method: string, path: string, duration: number, status: number) => {
    const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
    const message = `[API] ${method} ${path} - ${status} (${duration}ms)`;
    
    if (level === 'ERROR') {
      logger.error(message);
    } else if (level === 'WARN') {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  }
};

