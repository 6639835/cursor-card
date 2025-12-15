/**
 * Storage Manager
 * Handles browser extension storage operations
 * Cross-browser compatible (Chrome, Firefox, Edge)
 */

import { browserAPI } from './browser-polyfill.js';

// Helper to get the storage API (supports test environment)
const getStorageAPI = () => {
  // In test environment, use global chrome mock if available
  if (browserAPI === null && typeof globalThis.chrome !== 'undefined') {
    return globalThis.chrome;
  }
  return browserAPI;
};

export class StorageManager {
  // Define allowed storage keys and their validation schemas
  static STORAGE_SCHEMA = {
    selectedBin: {
      type: 'string',
      maxLength: 10,
      pattern: /^\d{4,10}$/,
      description: 'Selected BIN prefix'
    },
    customBin: {
      type: 'string',
      maxLength: 10,
      pattern: /^\d{0,10}$/,
      description: 'Custom BIN prefix'
    },
    selectedQuantity: {
      type: 'number',
      min: 1,
      max: 500,
      description: 'Batch generation quantity'
    },
    selectedPaymentMethod: {
      type: 'string',
      enum: ['card', 'bank'],
      description: 'Selected payment method'
    }
  };

  static MAX_VALUE_SIZE = 10000; // 10KB per value

  /**
   * Validate storage key and value against schema
   * @param {string} key - Storage key
   * @param {*} value - Value to validate
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   * @private
   */
  static validateStorage(key, value) {
    // Check if key is in schema
    if (!this.STORAGE_SCHEMA[key]) {
      console.warn(`Storage key '${key}' is not in schema`);
      return true; // Allow unregistered keys for now
    }

    const schema = this.STORAGE_SCHEMA[key];

    // Type validation
    if (schema.type === 'string' && typeof value !== 'string') {
      throw new Error(`${key} must be a string, got ${typeof value}`);
    }
    if (schema.type === 'number' && typeof value !== 'number') {
      throw new Error(`${key} must be a number, got ${typeof value}`);
    }
    if (schema.type === 'boolean' && typeof value !== 'boolean') {
      throw new Error(`${key} must be a boolean, got ${typeof value}`);
    }

    // String-specific validation
    if (schema.type === 'string') {
      if (schema.maxLength && value.length > schema.maxLength) {
        throw new Error(`${key} exceeds maximum length of ${schema.maxLength} (got ${value.length})`);
      }
      if (schema.pattern && !schema.pattern.test(value) && value !== '') {
        throw new Error(`${key} has invalid format (must match ${schema.pattern})`);
      }
      if (schema.enum && value !== '' && !schema.enum.includes(value)) {
        throw new Error(`${key} must be one of: ${schema.enum.join(', ')} (got '${value}')`);
      }
    }

    // Number-specific validation
    if (schema.type === 'number') {
      if (isNaN(value)) {
        throw new Error(`${key} must be a valid number`);
      }
      if (schema.min !== undefined && value < schema.min) {
        throw new Error(`${key} must be at least ${schema.min} (got ${value})`);
      }
      if (schema.max !== undefined && value > schema.max) {
        throw new Error(`${key} must be at most ${schema.max} (got ${value})`);
      }
    }

    // Size check (prevent storage abuse)
    const size = new Blob([JSON.stringify(value)]).size;
    if (size > this.MAX_VALUE_SIZE) {
      throw new Error(`Value for ${key} is too large (${size} bytes, max ${this.MAX_VALUE_SIZE})`);
    }

    return true;
  }
  /**
   * Save data to browser storage
   * @param {string} key - Storage key (must be in STORAGE_SCHEMA)
   * @param {*} value - Value to store
   * @returns {Promise<void>}
   */
  static async save(key, value) {
    try {
      // Validate before saving
      this.validateStorage(key, value);

      const api = getStorageAPI();
      await api.storage.local.set({ [key]: value });
      console.log(`Saved ${key}:`, value);
    } catch (error) {
      // Check for quota errors
      if (error.message && error.message.includes('QUOTA_BYTES')) {
        console.error('Storage quota exceeded');
        throw new Error('Storage quota exceeded. Please clear some data.');
      }
      console.error(`Failed to save ${key}:`, error);
      throw error;
    }
  }

  /**
   * Load data from browser storage with validation
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {Promise<*>} Stored value or default
   */
  static async load(key, defaultValue = null) {
    try {
      const api = getStorageAPI();
      const result = await api.storage.local.get(key);

      if (result[key] !== undefined) {
        // Validate loaded data
        try {
          this.validateStorage(key, result[key]);
          return result[key];
        } catch (validationError) {
          console.error(`Stored value for ${key} is invalid:`, validationError.message);
          // Return default if stored value is invalid
          return defaultValue;
        }
      }

      return defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Load multiple keys at once with validation
   * @param {string[]} keys - Array of keys to load
   * @returns {Promise<Object>} Object with all loaded values (invalid values are skipped)
   */
  static async loadMultiple(keys) {
    try {
      const api = getStorageAPI();
      const result = await api.storage.local.get(keys);

      // Validate each loaded value
      const validated = {};
      for (const key of keys) {
        if (result[key] !== undefined) {
          try {
            this.validateStorage(key, result[key]);
            validated[key] = result[key];
          } catch (validationError) {
            console.error(`Stored value for ${key} is invalid:`, validationError.message);
            // Skip invalid values
          }
        }
      }

      return validated;
    } catch (error) {
      console.error('Failed to load multiple keys:', error);
      return {};
    }
  }

  /**
   * Remove data from browser storage
   * @param {string} key - Storage key to remove
   * @returns {Promise<void>}
   */
  static async remove(key) {
    try {
      const api = getStorageAPI();
      await api.storage.local.remove(key);
      console.log(`Removed ${key}`);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  static async clear() {
    try {
      const api = getStorageAPI();
      await api.storage.local.clear();
      console.log('Storage cleared');
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  static async getUsageStats() {
    try {
      const api = getStorageAPI();
      if (api.storage.local.getBytesInUse) {
        const bytesInUse = await api.storage.local.getBytesInUse();
        const quotaBytes = api.storage.local.QUOTA_BYTES || 5242880; // 5MB default
        return {
          bytesInUse,
          quotaBytes,
          percentUsed: (bytesInUse / quotaBytes) * 100
        };
      }
      return { bytesInUse: 0, quotaBytes: 0, percentUsed: 0 };
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return { bytesInUse: 0, quotaBytes: 0, percentUsed: 0 };
    }
  }
}

