/**
 * Address Database Manager
 * Handles loading and retrieving real US addresses
 */

import {
  STREET_NAMES,
  STREET_TYPES,
  STREET_DIRECTIONS,
  ZIP_CODE_RANGES,
  DEFAULT_ZIP_RANGE,
  ADDRESS_GENERATION
} from './constants.js';

export class AddressDatabase {
  constructor() {
    this.database = null;
  }

  /**
   * Load the address database from file
   * @returns {Promise<Object>} The loaded database
   */
  async load() {
    if (this.database) {
      return this.database;
    }

    try {
      const response = await fetch(chrome.runtime.getURL('public/real-addresses.json'));
      this.database = await response.json();
      return this.database;
    } catch (error) {
      console.error('Failed to load address database:', error);
      return null;
    }
  }

  /**
   * Get a real address from database or generate fallback
   * @param {string} city - City name
   * @param {string} state - State code (e.g., 'CA', 'NY')
   * @returns {Promise<Object>} Address object
   */
  async getRealAddress(city, state) {
    const db = await this.load();

    if (db && db.US && db.US[state] && db.US[state][city]) {
      const addresses = db.US[state][city];
      if (addresses.length > 0) {
        const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];
        return {
          street: randomAddress.street,
          zip: randomAddress.zip,
          source: 'database'
        };
      }
    }

    // Fallback to generated address
    return this.generateRealisticAddress(city, state);
  }

  /**
   * Generate a realistic US address
   * @param {string} city - City name
   * @param {string} state - State code
   * @returns {Object} Generated address
   */
  generateRealisticAddress(city, state) {
    // Generate street number
    const streetNumber = Math.random() < (1 - ADDRESS_GENERATION.LARGE_NUMBER_PROBABILITY)
      ? Math.floor(Math.random() * ADDRESS_GENERATION.MAX_STREET_NUMBER) + 1
      : Math.floor(Math.random() * ADDRESS_GENERATION.MAX_STREET_NUMBER_LARGE) + ADDRESS_GENERATION.LARGE_NUMBER_MIN;

    // Add direction prefix
    const direction = Math.random() > ADDRESS_GENERATION.DIRECTION_PROBABILITY
      ? STREET_DIRECTIONS[Math.floor(Math.random() * STREET_DIRECTIONS.length)] + ' '
      : '';

    // Select street name
    const streetName = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];

    // Select street type using weighted random
    const random = Math.random();
    let cumulative = 0;
    let streetType = 'St';

    for (const type of STREET_TYPES) {
      cumulative += type.weight;
      if (random < cumulative) {
        streetType = type.name;
        break;
      }
    }

    // Generate ZIP code based on state
    const range = ZIP_CODE_RANGES[state] || DEFAULT_ZIP_RANGE;
    const zip = String(Math.floor(Math.random() * (range.max - range.min + 1)) + range.min).padStart(5, '0');

    return {
      street: `${streetNumber} ${direction}${streetName} ${streetType}`,
      zip: zip,
      source: 'generator'
    };
  }
}

// Singleton instance
export const addressDatabase = new AddressDatabase();

