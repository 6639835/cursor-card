/**
 * Person Generator
 * Generates realistic US person information using real names database
 */

import { browserAPI } from '../utils/browser-polyfill.js';

export class PersonGenerator {
  static namesDatabase = null;
  static statesDatabase = null;

  /**
   * Load the names database from file
   * @returns {Promise<Object>} The loaded database
   */
  static async loadNamesDatabase() {
    if (this.namesDatabase) {
      return this.namesDatabase;
    }

    try {
      const response = await fetch(browserAPI.runtime.getURL('public/real-names.json'));
      this.namesDatabase = await response.json();
      return this.namesDatabase;
    } catch (error) {
      console.error('Failed to load names database:', error);
      return null;
    }
  }

  /**
   * Load the states database from file
   * @returns {Promise<Object>} The loaded database
   */
  static async loadStatesDatabase() {
    if (this.statesDatabase) {
      return this.statesDatabase;
    }

    try {
      const response = await fetch(browserAPI.runtime.getURL('public/us-states.json'));
      this.statesDatabase = await response.json();
      return this.statesDatabase;
    } catch (error) {
      console.error('Failed to load states database:', error);
      return null;
    }
  }

  /**
   * Generate a random full name from database
   * @returns {Promise<string>} Full name
   */
  static async generateFullName() {
    const db = await this.loadNamesDatabase();

    if (!db || !db.firstNames || !db.lastNames) {
      return 'John Doe'; // Fallback
    }

    // Randomly choose male or female first name
    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const firstNames = db.firstNames[gender];
    const lastName = db.lastNames[Math.floor(Math.random() * db.lastNames.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];

    return `${firstName} ${lastName}`;
  }

  /**
   * Generate complete person information for US
   * @param {Object} faker - Faker.js instance
   * @returns {Promise<Object>} Person information
   */
  static async generate(faker) {
    // Set locale to English
    faker.locale = 'en';

    const province = faker.address.stateAbbr();
    const city = faker.address.city();
    const fullName = await this.generateFullName();

    return {
      fullName: fullName,
      country: 'US',
      province: province,
      city: city,
      addressLine2: faker.address.secondaryAddress()
    };
  }

  /**
   * Get state abbreviation from full name
   * @param {string} stateName - Full state name
   * @returns {Promise<string>} State abbreviation
   */
  static async getStateAbbr(stateName) {
    const db = await this.loadStatesDatabase();

    if (!db || !db.states) {
      // Fallback to original name if database fails
      return stateName;
    }

    return db.states[stateName] || stateName;
  }
}

