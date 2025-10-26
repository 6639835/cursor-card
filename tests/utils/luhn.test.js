/**
 * Tests for Luhn Algorithm Implementation
 */

import { LuhnValidator } from '../../src/utils/luhn.js';

describe('LuhnValidator', () => {
  describe('calculateCheckDigit', () => {
    test('should calculate correct check digit for valid partial card number', () => {
      // Test with known valid card numbers (without last digit)
      expect(LuhnValidator.calculateCheckDigit('532959123456789')).toBe('0');
      expect(LuhnValidator.calculateCheckDigit('411111111111111')).toBe('1');
      expect(LuhnValidator.calculateCheckDigit('552461234567890')).toBe('6');
    });

    test('should calculate check digit for short BIN', () => {
      const checkDigit = LuhnValidator.calculateCheckDigit('123456');
      expect(checkDigit).toMatch(/^[0-9]$/);
    });

    test('should handle 15-digit partial number (Amex)', () => {
      const checkDigit = LuhnValidator.calculateCheckDigit('37828224631000');
      expect(checkDigit).toMatch(/^[0-9]$/);
      // Verify the complete number is valid
      const fullNumber = '37828224631000' + checkDigit;
      expect(LuhnValidator.validate(fullNumber)).toBe(true);
    });

    test('should handle 16-digit partial number', () => {
      const checkDigit = LuhnValidator.calculateCheckDigit('532959123456789');
      expect(checkDigit).toBe('0');
      expect(LuhnValidator.validate('5329591234567890')).toBe(true);
    });

    test('should return string digit', () => {
      const result = LuhnValidator.calculateCheckDigit('123456789');
      expect(typeof result).toBe('string');
      expect(result.length).toBe(1);
    });
  });

  describe('validate', () => {
    test('should validate known valid card numbers', () => {
      // Common test card numbers
      expect(LuhnValidator.validate('4111111111111111')).toBe(true); // Visa
      expect(LuhnValidator.validate('5500000000000004')).toBe(true); // Mastercard
      expect(LuhnValidator.validate('340000000000009')).toBe(true);  // Amex
      expect(LuhnValidator.validate('6011000000000004')).toBe(true); // Discover
    });

    test('should reject invalid card numbers', () => {
      expect(LuhnValidator.validate('4111111111111112')).toBe(false);
      expect(LuhnValidator.validate('1234567890123456')).toBe(false);
      expect(LuhnValidator.validate('1111111111111111')).toBe(false);
    });

    test('should validate 15-digit Amex cards', () => {
      expect(LuhnValidator.validate('378282246310005')).toBe(true);
      expect(LuhnValidator.validate('371449635398431')).toBe(true);
    });

    test('should validate 16-digit cards', () => {
      expect(LuhnValidator.validate('5329591234567890')).toBe(true);
    });

    test('should reject cards with wrong checksum', () => {
      expect(LuhnValidator.validate('5329591234567891')).toBe(false);
      expect(LuhnValidator.validate('4111111111111110')).toBe(false);
    });

    test('should handle edge cases', () => {
      // Single digit
      expect(LuhnValidator.validate('0')).toBe(true);

      // Short valid number
      expect(LuhnValidator.validate('18')).toBe(true);
    });
  });

  describe('Integration - calculateCheckDigit + validate', () => {
    test('should create valid card numbers when combined', () => {
      const partialNumbers = [
        '532959123456789',
        '411111111111111',
        '552461234567890',
        '625969987654321',
        '37828224631000'
      ];

      partialNumbers.forEach(partial => {
        const checkDigit = LuhnValidator.calculateCheckDigit(partial);
        const fullNumber = partial + checkDigit;
        expect(LuhnValidator.validate(fullNumber)).toBe(true);
      });
    });

    test('should work with random partial numbers', () => {
      // Generate random partial numbers
      for (let i = 0; i < 100; i++) {
        const length = Math.random() > 0.5 ? 15 : 14; // Amex or regular
        let partial = '';
        for (let j = 0; j < length; j++) {
          partial += Math.floor(Math.random() * 10);
        }

        const checkDigit = LuhnValidator.calculateCheckDigit(partial);
        const fullNumber = partial + checkDigit;
        expect(LuhnValidator.validate(fullNumber)).toBe(true);
      }
    });
  });
});

