/**
 * Credit Card Generator
 * Generates realistic credit card information using Luhn algorithm and Markov chains
 */

import { LuhnValidator } from '../utils/luhn.js';
import { MarkovChainGenerator } from '../utils/markov.js';
import { binDatabase } from '../utils/bin-database.js';
import {
  EXPIRY_YEAR_OFFSETS,
  COMMON_EXPIRY_MONTHS,
  COMMON_MONTH_PROBABILITY,
  WEAK_CVV_BLACKLIST,
  US_ROUTING_NUMBERS,
  ACCOUNT_NUMBER_RANGE
} from '../utils/constants.js';

export class CardGenerator {
  /**
   * Hash a bank name to generate a seed
   * @param {string} bankName - Bank name to hash
   * @returns {number} Hash value
   */
  static hashBankName(bankName) {
    let hash = 0;
    for (let i = 0; i < bankName.length; i++) {
      const char = bankName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Generate account number segment using Markov chain
   * @param {number} length - Length of segment to generate
   * @param {string} binPrefix - BIN prefix
   * @param {string} bankName - Bank name for seeding
   * @returns {string} Generated segment
   */
  static generateAccountSegment(length, binPrefix, bankName = 'Unknown') {
    let segment = '';
    const binSeed = parseInt(binPrefix.slice(-4)) % 100;
    const bankSeed = this.hashBankName(bankName);

    for (let i = 0; i < length; i++) {
      if (i < 2) {
        // First 2 digits based on BIN and bank
        const base = Math.floor((binSeed + bankSeed) / 10) % 10;
        const range = base + 5;
        segment += (Math.floor(Math.random() * (range - base + 1)) + base) % 10;
      } else if (i < length - 3) {
        // Middle digits using Markov chain
        segment += MarkovChainGenerator.getNextDigit(segment, binPrefix);
      } else {
        // Last 3 digits - avoid repetition
        const lastDigit = segment.length > 0 ? parseInt(segment[segment.length - 1]) : 5;
        let nextDigit;
        do {
          nextDigit = Math.floor(Math.random() * 10);
        } while (nextDigit === lastDigit);
        segment += nextDigit;
      }
    }

    return segment;
  }

  /**
   * Generate realistic expiry date
   * @returns {Object} Object with expMonth and expYear
   */
  static generateExpiryDate() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const random = Math.random();
    let cumulative = 0;
    let yearsToAdd = 3;

    for (const { years, weight } of EXPIRY_YEAR_OFFSETS) {
      cumulative += weight;
      if (random < cumulative) {
        yearsToAdd = years;
        break;
      }
    }

    let expYear = currentYear + yearsToAdd;
    let expMonth;

    // Month distribution (80% common months)
    if (Math.random() < COMMON_MONTH_PROBABILITY) {
      expMonth = COMMON_EXPIRY_MONTHS[Math.floor(Math.random() * COMMON_EXPIRY_MONTHS.length)];
    } else {
      expMonth = Math.floor(Math.random() * 12) + 1;
    }

    // Ensure expiry is in the future
    if (expYear === currentYear && expMonth <= currentMonth) {
      expYear++;
    }

    return {
      expMonth: String(expMonth).padStart(2, '0'),
      expYear: String(expYear).slice(-2)
    };
  }

  /**
   * Generate CVV/CVC code
   * @param {string} cardNumber - Full card number
   * @param {string} expiryDate - Expiry date (MM/YY)
   * @param {number} cvvLength - CVV length (3 or 4)
   * @returns {string} Generated CVV
   */
  static generateCVV(cardNumber, expiryDate, cvvLength = 3) {
    // Generate related to card number and expiry
    const seed = parseInt(cardNumber.slice(-4)) + parseInt(expiryDate.replace(/\D/g, ''));
    const pseudoRandom = (seed * 9301 + 49297) % 233280;

    let cvv;
    if (cvvLength === 4) {
      cvv = String((pseudoRandom % 9000) + 1000);
    } else {
      cvv = String((pseudoRandom % 900) + 100);
    }

    // Avoid weak patterns
    if (this.isWeakCVV(cvv)) {
      const offset = cvvLength === 4 ? 1234 : 123;
      if (cvvLength === 4) {
        cvv = String(((pseudoRandom + offset) % 9000) + 1000);
      } else {
        cvv = String(((pseudoRandom + offset) % 900) + 100);
      }
    }

    return cvv;
  }

  /**
   * Check if CVV is weak (repetitive or sequential)
   * @param {string} cvv - CVV to check
   * @returns {boolean} True if weak
   */
  static isWeakCVV(cvv) {
    const cvvStr = String(cvv);

    // All same digits
    if (cvvStr[0] === cvvStr[1] && cvvStr[1] === cvvStr[2]) {
      return true;
    }

    // Sequential
    if (cvvStr.length === 3) {
      const d1 = parseInt(cvvStr[0]);
      const d2 = parseInt(cvvStr[1]);
      const d3 = parseInt(cvvStr[2]);
      if (d2 === d1 + 1 && d3 === d2 + 1) {
        return true;
      }
      if (d2 === d1 - 1 && d3 === d2 - 1) {
        return true;
      }
    }

    // Blacklist
    if (WEAK_CVV_BLACKLIST.includes(cvvStr)) {
      return true;
    }

    return false;
  }

  /**
   * Format card number with spaces
   * @param {string} cardNumber - Unformatted card number
   * @param {boolean} isAmex - Is American Express
   * @returns {string} Formatted card number
   */
  static formatCardNumber(cardNumber, isAmex) {
    if (isAmex) {
      return cardNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
    } else {
      return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
  }

  /**
   * Generate complete card information
   * @param {string} binPrefix - BIN prefix to use
   * @returns {Promise<Object>} Card information object
   */
  static async generateCardInfo(binPrefix) {
    if (!binPrefix || binPrefix.length === 0) {
      throw new Error('BIN prefix required');
    }

    const cleanBin = binPrefix.toString().replace(/\D/g, '');
    const brandInfo = await binDatabase.detectCardBrand(cleanBin);
    const cardLength = brandInfo.length;
    const isAmex = brandInfo.name === 'American Express';
    const bankName = brandInfo.bank || 'Unknown';

    const remainingLength = cardLength - cleanBin.length;

    if (remainingLength <= 1) {
      throw new Error(`BIN too long for ${cardLength} digit card`);
    }

    const accountLength = remainingLength - 1; // Reserve 1 for check digit

    // Generate card number without check digit
    let partialNumber = cleanBin;

    if (accountLength > 0) {
      const accountSegment = this.generateAccountSegment(accountLength, cleanBin, bankName);
      partialNumber += accountSegment;
    }

    // Calculate and append check digit
    const checkDigit = LuhnValidator.calculateCheckDigit(partialNumber);
    const fullCardNumber = partialNumber + checkDigit;

    // Validate
    if (!LuhnValidator.validate(fullCardNumber)) {
      console.warn('Luhn validation failed, regenerating...');
      return await this.generateCardInfo(binPrefix);
    }

    // Generate expiry date
    const { expMonth, expYear } = this.generateExpiryDate();
    const expiryDate = `${expMonth}/${expYear}`;

    // Generate CVV
    const cvv = this.generateCVV(fullCardNumber, expiryDate, brandInfo.cvvLength);

    return {
      cardNumber: this.formatCardNumber(fullCardNumber, isAmex),
      expiryDate: expiryDate,
      cvc: cvv,
      cardBrand: brandInfo.name,
      bank: bankName,
      country: brandInfo.country,
      type: brandInfo.type
    };
  }

  /**
   * Generate US bank account number
   * @returns {string} Account number (9-12 digits)
   */
  static generateAccountNumber() {
    const range = ACCOUNT_NUMBER_RANGE.MAX_LENGTH - ACCOUNT_NUMBER_RANGE.MIN_LENGTH + 1;
    const length = Math.floor(Math.random() * range) + ACCOUNT_NUMBER_RANGE.MIN_LENGTH;
    let accountNumber = '';
    for (let i = 0; i < length; i++) {
      accountNumber += Math.floor(Math.random() * 10);
    }
    return accountNumber;
  }

  /**
   * Generate US routing number (from common banks)
   * @returns {string} Routing number
   */
  static generateRoutingNumber() {
    const randomIndex = Math.floor(Math.random() * US_ROUTING_NUMBERS.length);
    return US_ROUTING_NUMBERS[randomIndex];
  }
}

