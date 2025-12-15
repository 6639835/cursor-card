/**
 * Error Handling Utility
 * Provides centralized error handling and user-friendly error messages
 */

export class ErrorHandler {
  /**
   * Handle and log errors with user-friendly messages
   * @param {Error|string} error - Error object or message
   * @param {string} context - Context where error occurred
   * @param {string} userMessage - Optional user-friendly message
   * @returns {void}
   */
  static handleError(error, context = '', userMessage = null) {
    // Log detailed error for debugging
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${context}]`, error);

    // Show user-friendly message if provided
    if (userMessage) {
      this.showUserError(userMessage, error);
    }

    // Log structured error
    this.logError(context, error);
  }

  /**
   * Show user-friendly error message
   * @param {string} message - User-friendly message
   * @param {Error|string} error - Original error (optional)
   * @returns {void}
   */
  static showUserError(message, error = null) {
    let displayMessage = message;

    // Add error detail if available and helpful
    if (error && error.message && !message.includes(error.message)) {
      // Only add detail if it's not too technical
      const errorMsg = error.message;
      if (!errorMsg.includes('undefined') && !errorMsg.includes('null')) {
        displayMessage += `\n\nDetails: ${errorMsg}`;
      }
    }

    alert(displayMessage);
  }

  /**
   * Log structured error information
   * @param {string} context - Context where error occurred
   * @param {Error|string} error - Error to log
   * @returns {void}
   * @private
   */
  static logError(context, error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      message: error?.message || String(error),
      stack: error?.stack,
      userAgent: navigator.userAgent,
      url: window.location?.href
    };

    console.log('ERROR LOG:', logEntry);

    // In production, could send to logging service
    // this.sendToLoggingService(logEntry);
  }

  /**
   * Try an operation with automatic fallback
   * @param {Function} primaryFn - Primary function to try
   * @param {Function} fallbackFn - Fallback function if primary fails
   * @param {string} context - Context for logging
   * @returns {Promise<*>} Result from primary or fallback function
   */
  static async tryWithFallback(primaryFn, fallbackFn, context = '') {
    try {
      return await primaryFn();
    } catch (error) {
      console.warn(`${context} primary method failed, using fallback:`, error);

      try {
        return await fallbackFn();
      } catch (fallbackError) {
        console.error(`${context} fallback also failed:`, fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Try an operation with retry logic
   * @param {Function} operation - Async function to retry
   * @param {number} maxRetries - Maximum number of retries (default: 3)
   * @param {number} delayMs - Delay between retries in ms (default: 1000)
   * @param {string} context - Context for logging
   * @returns {Promise<*>} Result from successful operation
   */
  static async retry(operation, maxRetries = 3, delayMs = 1000, context = '') {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`${context} attempt ${attempt}/${maxRetries} failed:`, error);

        // Don't delay after last attempt
        if (attempt < maxRetries) {
          await this.sleep(delayMs);
        }
      }
    }

    // All retries failed
    throw new Error(`${context} failed after ${maxRetries} attempts: ${lastError?.message || lastError}`);
  }

  /**
   * Execute operation with timeout
   * @param {Function} operation - Async function to execute
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {string} context - Context for error message
   * @returns {Promise<*>} Result from operation
   */
  static async withTimeout(operation, timeoutMs, context = 'Operation') {
    return Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${context} timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Wrap async function with comprehensive error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Context for logging
   * @param {string} userMessage - User-friendly error message
   * @returns {Function} Wrapped function
   */
  static wrapAsync(fn, context, userMessage) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error, context, userMessage);
        throw error;
      }
    };
  }

  /**
   * Validate and throw if invalid
   * @param {boolean} condition - Condition to validate
   * @param {string} message - Error message if condition is false
   * @throws {Error} If condition is false
   */
  static assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly error message for common errors
   * @param {Error|string} error - Error to parse
   * @returns {string} User-friendly message
   */
  static getUserFriendlyMessage(error) {
    const message = error?.message || String(error);

    // Map common errors to user-friendly messages
    const errorMap = {
      'Failed to fetch': 'Network error. Please check your internet connection.',
      'NetworkError': 'Network error. Please check your internet connection.',
      'TypeError: null': 'Data not found. Please try again.',
      'Cannot read property': 'Data not available. Please refresh and try again.',
      'QUOTA_BYTES': 'Storage full. Please clear some data.',
      'The quota has been exceeded': 'Storage full. Please clear some data.',
      'Extension context invalidated': 'Extension reloaded. Please refresh the page.',
      'Receiving end does not exist': 'Connection lost. Please refresh the page.'
    };

    // Check for known errors
    for (const [key, friendlyMessage] of Object.entries(errorMap)) {
      if (message.includes(key)) {
        return friendlyMessage;
      }
    }

    // Return generic message for unknown errors
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Is this a transient error that can be retried?
   * @param {Error|string} error - Error to check
   * @returns {boolean} True if error is transient
   */
  static isTransientError(error) {
    const message = error?.message || String(error);

    const transientErrors = [
      'Failed to fetch',
      'NetworkError',
      'timeout',
      'ECONNRESET',
      'ETIMEDOUT',
      'temporarily unavailable'
    ];

    return transientErrors.some(e => message.includes(e));
  }

  /**
   * Create error with additional context
   * @param {string} message - Error message
   * @param {Object} context - Additional context
   * @returns {Error} Error with context
   */
  static createError(message, context = {}) {
    const error = new Error(message);
    error.context = context;
    return error;
  }
}
