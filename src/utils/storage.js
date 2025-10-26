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
  /**
   * Save data to browser storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {Promise<void>}
   */
  static async save(key, value) {
    try {
      const api = getStorageAPI();
      await api.storage.local.set({ [key]: value });
      console.log(`Saved ${key}:`, value);
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      throw error;
    }
  }

  /**
   * Load data from browser storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {Promise<*>} Stored value or default
   */
  static async load(key, defaultValue = null) {
    try {
      const api = getStorageAPI();
      const result = await api.storage.local.get(key);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Load multiple keys at once
   * @param {string[]} keys - Array of keys to load
   * @returns {Promise<Object>} Object with all loaded values
   */
  static async loadMultiple(keys) {
    try {
      const api = getStorageAPI();
      return await api.storage.local.get(keys);
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
}

