/**
 * BIN (Bank Identification Number) Database Manager
 * Handles loading and querying card BIN information
 */

export class BINDatabase {
  constructor() {
    this.database = null;
  }

  /**
   * Load the BIN database from file
   * @returns {Promise<Object>} The loaded database
   */
  async load() {
    if (this.database) {
      return this.database;
    }

    try {
      const response = await fetch(chrome.runtime.getURL('public/bin-database.json'));
      const data = await response.json();
      this.database = data;
      return this.database;
    } catch (error) {
      console.error('Failed to load BIN database:', error);
      return null;
    }
  }

  /**
   * Detect card brand and properties from BIN prefix
   * @param {string} binPrefix - BIN prefix to look up
   * @returns {Promise<Object>} Card brand information
   */
  async detectCardBrand(binPrefix) {
    const db = await this.load();
    const binStr = binPrefix.toString();

    // Try database lookup with decreasing precision
    if (db && db.bins) {
      // Try exact match
      if (db.bins[binStr]) {
        return this._formatBrandInfo(db.bins[binStr]);
      }

      // Try 4-digit prefix
      const bin4 = binStr.substring(0, 4);
      if (db.bins[bin4]) {
        return this._formatBrandInfo(db.bins[bin4]);
      }

      // Try 2-digit prefix
      const bin2 = binStr.substring(0, 2);
      if (db.bins[bin2]) {
        return this._formatBrandInfo(db.bins[bin2]);
      }

      // Try 1-digit prefix
      const bin1 = binStr.substring(0, 1);
      if (db.bins[bin1]) {
        return this._formatBrandInfo(db.bins[bin1]);
      }
    }

    // Fallback to traditional rules
    return this._detectByTraditionalRules(binStr);
  }

  /**
   * Format brand information from database
   * @private
   */
  _formatBrandInfo(info) {
    return {
      name: info.brand,
      length: info.length,
      cvvLength: info.cvvLength,
      bank: info.bank,
      country: info.country,
      type: info.type
    };
  }

  /**
   * Detect card brand using traditional rules
   * @private
   */
  _detectByTraditionalRules(binStr) {
    // Visa
    if (binStr.startsWith('4')) {
      return {
        name: 'Visa',
        length: 16,
        cvvLength: 3,
        bank: 'Unknown',
        country: 'US',
        type: 'credit'
      };
    }

    // MasterCard
    if (/^5[1-5]/.test(binStr) || /^2[2-7]/.test(binStr)) {
      return {
        name: 'MasterCard',
        length: 16,
        cvvLength: 3,
        bank: 'Unknown',
        country: 'US',
        type: 'credit'
      };
    }

    // American Express
    if (binStr.startsWith('34') || binStr.startsWith('37')) {
      return {
        name: 'American Express',
        length: 15,
        cvvLength: 4,
        bank: 'Unknown',
        country: 'US',
        type: 'credit'
      };
    }

    // Discover
    if (binStr.startsWith('6011') || /^62[2-9]/.test(binStr) ||
        /^64[4-9]/.test(binStr) || binStr.startsWith('65')) {
      return {
        name: 'Discover',
        length: 16,
        cvvLength: 3,
        bank: 'Unknown',
        country: 'US',
        type: 'credit'
      };
    }

    // Diners Club
    if (binStr.startsWith('36') || binStr.startsWith('38')) {
      return {
        name: 'Diners Club',
        length: 14,
        cvvLength: 3,
        bank: 'Unknown',
        country: 'US',
        type: 'credit'
      };
    }

    // JCB
    if (/^35[2-8]/.test(binStr)) {
      return {
        name: 'JCB',
        length: 16,
        cvvLength: 3,
        bank: 'Unknown',
        country: 'JP',
        type: 'credit'
      };
    }

    // UnionPay
    if (binStr.startsWith('62')) {
      return {
        name: 'UnionPay',
        length: 16,
        cvvLength: 3,
        bank: 'Unknown',
        country: 'CN',
        type: 'credit'
      };
    }

    // Default
    return {
      name: 'Unknown',
      length: 16,
      cvvLength: 3,
      bank: 'Unknown',
      country: 'US',
      type: 'credit'
    };
  }
}

// Singleton instance
export const binDatabase = new BINDatabase();

