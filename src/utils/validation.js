/**
 * Input Validation Utility
 * Provides comprehensive validation and sanitization for all user inputs
 */

export class Validator {
  /**
   * Validate BIN (Bank Identification Number) format
   * @param {string|number} bin - BIN to validate
   * @returns {{valid: boolean, value?: string, error?: string}} Validation result
   */
  static validateBIN(bin) {
    if (!bin && bin !== 0) {
      return { valid: false, error: 'BIN is required' };
    }

    const cleaned = String(bin).replace(/\D/g, '');

    if (cleaned.length < 4) {
      return { valid: false, error: 'BIN must be at least 4 digits' };
    }

    if (cleaned.length > 10) {
      return { valid: false, error: 'BIN cannot exceed 10 digits' };
    }

    return { valid: true, value: cleaned };
  }

  /**
   * Validate quantity for batch generation
   * @param {string|number} quantity - Quantity to validate
   * @param {number} max - Maximum allowed (default: 500)
   * @returns {{valid: boolean, value?: number, error?: string}} Validation result
   */
  static validateQuantity(quantity, max = 500) {
    const num = parseInt(quantity, 10);

    if (isNaN(num)) {
      return { valid: false, error: 'Quantity must be a number' };
    }

    if (num < 1) {
      return { valid: false, error: 'Quantity must be at least 1' };
    }

    if (num > max) {
      return { valid: false, error: `Quantity cannot exceed ${max}` };
    }

    return { valid: true, value: num };
  }

  /**
   * Sanitize all card data fields
   * @param {Object} data - Card data to sanitize
   * @returns {Object} Sanitized card data
   */
  static sanitizeCardData(data) {
    if (!data || typeof data !== 'object') {
      return {};
    }

    return {
      cardNumber: this.sanitizeNumeric(data.cardNumber, 19),
      expiryDate: this.sanitizeExpiry(data.expiryDate),
      cvc: this.sanitizeNumeric(data.cvc, 4),
      fullName: this.sanitizeName(data.fullName),
      country: this.sanitizeAlpha(data.country, 2),
      province: this.sanitizeAlpha(data.province, 2),
      city: this.sanitizeAlphanumeric(data.city, 50),
      address: this.sanitizeAddress(data.address, 100),
      addressLine2: this.sanitizeAddress(data.addressLine2, 100),
      postalCode: this.sanitizePostalCode(data.postalCode),
      routingNumber: this.sanitizeNumeric(data.routingNumber, 9),
      accountNumber: this.sanitizeNumeric(data.accountNumber, 17)
    };
  }

  /**
   * Sanitize numeric string (remove non-digits)
   * @param {string} value - Value to sanitize
   * @param {number} maxLength - Maximum length
   * @returns {string} Sanitized numeric string
   */
  static sanitizeNumeric(value, maxLength = 20) {
    if (!value) return '';
    const cleaned = String(value).replace(/\D/g, '');
    return cleaned.substring(0, maxLength);
  }

  /**
   * Sanitize name (allow letters, spaces, hyphens, apostrophes)
   * @param {string} value - Name to sanitize
   * @param {number} maxLength - Maximum length (default: 100)
   * @returns {string} Sanitized name
   */
  static sanitizeName(value, maxLength = 100) {
    if (!value) return '';
    // Allow letters, spaces, hyphens, apostrophes, periods
    const cleaned = String(value).replace(/[^a-zA-Z\s'\-.]/g, '');
    return cleaned.substring(0, maxLength).trim();
  }

  /**
   * Sanitize address (allow alphanumeric and common punctuation)
   * @param {string} value - Address to sanitize
   * @param {number} maxLength - Maximum length (default: 100)
   * @returns {string} Sanitized address
   */
  static sanitizeAddress(value, maxLength = 100) {
    if (!value) return '';
    // Allow alphanumeric, spaces, and common address punctuation
    const cleaned = String(value).replace(/[^a-zA-Z0-9\s,.\-#]/g, '');
    return cleaned.substring(0, maxLength).trim();
  }

  /**
   * Sanitize postal code (allow alphanumeric and hyphen)
   * @param {string} value - Postal code to sanitize
   * @returns {string} Sanitized postal code
   */
  static sanitizePostalCode(value) {
    if (!value) return '';
    // Allow alphanumeric and hyphen (US and international formats)
    const cleaned = String(value).replace(/[^a-zA-Z0-9\s-]/g, '');
    return cleaned.substring(0, 10).trim().toUpperCase();
  }

  /**
   * Sanitize expiry date (format: MM/YY)
   * @param {string} value - Expiry date to sanitize
   * @returns {string} Sanitized expiry date
   */
  static sanitizeExpiry(value) {
    if (!value) return '';

    // Remove all non-digits and slashes
    let cleaned = String(value).replace(/[^\d/]/g, '');

    // Check if it matches MM/YY format
    const match = cleaned.match(/^(\d{1,2})\/?(\d{0,2})$/);
    if (!match) return '';

    let [, month, year] = match;

    // Pad month to 2 digits
    month = month.padStart(2, '0');

    // Validate month
    const monthNum = parseInt(month, 10);
    if (monthNum < 1 || monthNum > 12) {
      // Try to fix common mistakes
      if (monthNum > 12 && monthNum <= 31) {
        // Might have swapped day/month
        return '';
      }
      return '';
    }

    // Return formatted
    if (year) {
      return `${month}/${year.substring(0, 2)}`;
    } else {
      return month;
    }
  }

  /**
   * Sanitize alpha-only string (letters only)
   * @param {string} value - Value to sanitize
   * @param {number} length - Exact length or max length
   * @returns {string} Sanitized alpha string
   */
  static sanitizeAlpha(value, length) {
    if (!value) return '';
    const cleaned = String(value).replace(/[^a-zA-Z]/g, '');
    return cleaned.substring(0, length).toUpperCase();
  }

  /**
   * Sanitize alphanumeric string (letters and numbers)
   * @param {string} value - Value to sanitize
   * @param {number} maxLength - Maximum length
   * @returns {string} Sanitized alphanumeric string
   */
  static sanitizeAlphanumeric(value, maxLength = 50) {
    if (!value) return '';
    const cleaned = String(value).replace(/[^a-zA-Z0-9\s]/g, '');
    return cleaned.substring(0, maxLength).trim();
  }

  /**
   * Validate email format (basic validation)
   * @param {string} email - Email to validate
   * @returns {{valid: boolean, value?: string, error?: string}} Validation result
   */
  static validateEmail(email) {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }

    const cleaned = String(email).trim();

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleaned)) {
      return { valid: false, error: 'Invalid email format' };
    }

    if (cleaned.length > 254) {
      return { valid: false, error: 'Email too long' };
    }

    return { valid: true, value: cleaned };
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {{valid: boolean, value?: string, error?: string}} Validation result
   */
  static validateURL(url) {
    if (!url) {
      return { valid: false, error: 'URL is required' };
    }

    try {
      const urlObj = new URL(url);

      // Only allow http and https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'URL must use http or https protocol' };
      }

      return { valid: true, value: urlObj.href };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} value - HTML string to sanitize
   * @returns {string} Sanitized string (strips all HTML)
   */
  static sanitizeHTML(value) {
    if (!value) return '';

    // Remove all HTML tags
    const cleaned = String(value).replace(/<[^>]*>/g, '');

    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = cleaned;

    return textarea.value;
  }

  /**
   * Validate and sanitize integer
   * @param {*} value - Value to validate
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {{valid: boolean, value?: number, error?: string}} Validation result
   */
  static validateInteger(value, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
    const num = parseInt(value, 10);

    if (isNaN(num)) {
      return { valid: false, error: 'Value must be an integer' };
    }

    if (num < min) {
      return { valid: false, error: `Value must be at least ${min}` };
    }

    if (num > max) {
      return { valid: false, error: `Value must be at most ${max}` };
    }

    return { valid: true, value: num };
  }
}
