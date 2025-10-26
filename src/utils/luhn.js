/**
 * Luhn Algorithm Implementation
 * Used for credit card number validation and check digit calculation
 */

export class LuhnValidator {
  /**
   * Calculate the Luhn check digit for a partial card number
   * @param {string} partialNumber - Card number without check digit
   * @returns {string} The check digit
   */
  static calculateCheckDigit(partialNumber) {
    let sum = 0;
    let shouldDouble = true;

    // Process digits from right to left
    for (let i = partialNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(partialNumber[i]);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  }

  /**
   * Validate a complete card number using Luhn algorithm
   * @param {string} cardNumber - Complete card number to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static validate(cardNumber) {
    let sum = 0;
    let shouldDouble = false;

    // Process all digits from right to left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }
}

