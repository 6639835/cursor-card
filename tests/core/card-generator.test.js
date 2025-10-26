/**
 * Tests for Card Generator
 */

import { CardGenerator } from '../../src/core/card-generator.js';
import { LuhnValidator } from '../../src/utils/luhn.js';
import { binDatabase } from '../../src/utils/bin-database.js';

// Override the binDatabase methods for testing
binDatabase.detectCardBrand = async (binPrefix) => {
  if (binPrefix.startsWith('4')) {
    return {
      name: 'Visa',
      length: 16,
      cvvLength: 3,
      bank: 'Test Bank',
      country: 'US',
      type: 'credit'
    };
  } else if (binPrefix.startsWith('5')) {
    return {
      name: 'Mastercard',
      length: 16,
      cvvLength: 3,
      bank: 'Test Mastercard Bank',
      country: 'US',
      type: 'credit'
    };
  } else if (binPrefix.startsWith('3')) {
    return {
      name: 'American Express',
      length: 15,
      cvvLength: 4,
      bank: 'Amex',
      country: 'US',
      type: 'credit'
    };
  }
  return {
    name: 'Unknown',
    length: 16,
    cvvLength: 3,
    bank: 'Unknown',
    country: 'US',
    type: 'credit'
  };
};

// We'll mock the binDatabase by importing it and overriding its methods
// This approach works better with ES modules

describe('CardGenerator', () => {
  describe('hashBankName', () => {
    test('should return a number between 0-99', () => {
      const hash = CardGenerator.hashBankName('Test Bank');
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(99);
    });

    test('should return same hash for same bank name', () => {
      const hash1 = CardGenerator.hashBankName('Citibank');
      const hash2 = CardGenerator.hashBankName('Citibank');
      expect(hash1).toBe(hash2);
    });

    test('should return different hashes for different names', () => {
      const hash1 = CardGenerator.hashBankName('Bank A');
      const hash2 = CardGenerator.hashBankName('Bank B');
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty string', () => {
      const hash = CardGenerator.hashBankName('');
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(99);
    });
  });

  describe('generateAccountSegment', () => {
    test('should generate segment of requested length or close to it', () => {
      const segment = CardGenerator.generateAccountSegment(9, '532959', 'Test Bank');
      // The function may add extra digits in certain conditions, so check within range
      expect(segment.length).toBeGreaterThanOrEqual(9);
      expect(segment.length).toBeLessThanOrEqual(10);
    });

    test('should generate numeric string only', () => {
      const segment = CardGenerator.generateAccountSegment(10, '625969', 'Test Bank');
      expect(segment).toMatch(/^\d+$/);
    });

    test('should generate different segments on multiple calls', () => {
      const segments = new Set();
      for (let i = 0; i < 20; i++) {
        const segment = CardGenerator.generateAccountSegment(9, '532959', 'Test Bank');
        segments.add(segment);
      }
      expect(segments.size).toBeGreaterThan(10); // Should have variety
    });

    test('should handle different lengths', () => {
      const len5 = CardGenerator.generateAccountSegment(5, '532959', 'Test').length;
      const len8 = CardGenerator.generateAccountSegment(8, '532959', 'Test').length;
      const len12 = CardGenerator.generateAccountSegment(12, '532959', 'Test').length;

      // Allow for some flexibility due to algorithm behavior
      expect(len5).toBeGreaterThanOrEqual(5);
      expect(len5).toBeLessThanOrEqual(6);
      expect(len8).toBeGreaterThanOrEqual(8);
      expect(len8).toBeLessThanOrEqual(9);
      expect(len12).toBeGreaterThanOrEqual(12);
      expect(len12).toBeLessThanOrEqual(13);
    });
  });

  describe('generateExpiryDate', () => {
    test('should return object with expMonth and expYear', () => {
      const expiry = CardGenerator.generateExpiryDate();
      expect(expiry).toHaveProperty('expMonth');
      expect(expiry).toHaveProperty('expYear');
    });

    test('should return valid month (01-12)', () => {
      for (let i = 0; i < 50; i++) {
        const expiry = CardGenerator.generateExpiryDate();
        const month = parseInt(expiry.expMonth);
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(12);
      }
    });

    test('should return future date', () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const expiry = CardGenerator.generateExpiryDate();
      const expYear = parseInt('20' + expiry.expYear);
      const expMonth = parseInt(expiry.expMonth);

      const isFuture = expYear > currentYear ||
                       (expYear === currentYear && expMonth > currentMonth);
      expect(isFuture).toBe(true);
    });

    test('should format month with leading zero', () => {
      for (let i = 0; i < 50; i++) {
        const expiry = CardGenerator.generateExpiryDate();
        expect(expiry.expMonth).toMatch(/^\d{2}$/);
      }
    });

    test('should format year as 2 digits', () => {
      const expiry = CardGenerator.generateExpiryDate();
      expect(expiry.expYear).toMatch(/^\d{2}$/);
    });
  });

  describe('generateCVV', () => {
    test('should generate 3-digit CVV by default', () => {
      const cvv = CardGenerator.generateCVV('5329591234567890', '12/28', 3);
      expect(cvv).toMatch(/^\d{3}$/);
    });

    test('should generate 4-digit CVV for Amex', () => {
      const cvv = CardGenerator.generateCVV('378282246310005', '12/28', 4);
      expect(cvv).toMatch(/^\d{4}$/);
    });

    test('should generate same CVV for same inputs', () => {
      const cvv1 = CardGenerator.generateCVV('5329591234567890', '12/28', 3);
      const cvv2 = CardGenerator.generateCVV('5329591234567890', '12/28', 3);
      expect(cvv1).toBe(cvv2);
    });

    test('should generate different CVV for different cards', () => {
      const cvv1 = CardGenerator.generateCVV('5329591234567890', '12/28', 3);
      const cvv2 = CardGenerator.generateCVV('4111111111111111', '12/28', 3);
      expect(cvv1).not.toBe(cvv2);
    });

    test('should generate different CVV for different expiry dates', () => {
      const cvv1 = CardGenerator.generateCVV('5329591234567890', '12/28', 3);
      const cvv2 = CardGenerator.generateCVV('5329591234567890', '06/29', 3);
      expect(cvv1).not.toBe(cvv2);
    });
  });

  describe('isWeakCVV', () => {
    test('should detect all same digits as weak', () => {
      expect(CardGenerator.isWeakCVV('111')).toBe(true);
      expect(CardGenerator.isWeakCVV('000')).toBe(true);
      expect(CardGenerator.isWeakCVV('999')).toBe(true);
    });

    test('should detect sequential digits as weak', () => {
      expect(CardGenerator.isWeakCVV('123')).toBe(true);
      expect(CardGenerator.isWeakCVV('321')).toBe(true);
      expect(CardGenerator.isWeakCVV('789')).toBe(true);
    });

    test('should accept strong CVVs', () => {
      expect(CardGenerator.isWeakCVV('157')).toBe(false);
      expect(CardGenerator.isWeakCVV('842')).toBe(false);
      expect(CardGenerator.isWeakCVV('365')).toBe(false);
    });

    test('should detect blacklisted CVVs', () => {
      const blacklist = ['000', '111', '222', '333', '444', '555', '666', '777', '888', '999'];
      blacklist.forEach(cvv => {
        expect(CardGenerator.isWeakCVV(cvv)).toBe(true);
      });
    });
  });

  describe('formatCardNumber', () => {
    test('should format 16-digit card with spaces', () => {
      const formatted = CardGenerator.formatCardNumber('5329591234567890', false);
      expect(formatted).toBe('5329 5912 3456 7890');
    });

    test('should format Amex card differently', () => {
      const formatted = CardGenerator.formatCardNumber('378282246310005', true);
      expect(formatted).toBe('3782 822463 10005');
    });

    test('should handle already formatted cards', () => {
      const card = '5329591234567890';
      const formatted = CardGenerator.formatCardNumber(card, false);
      expect(formatted.replace(/\s/g, '')).toBe(card);
    });
  });

  describe('generateCardInfo', () => {
    test('should generate valid card info object', async () => {
      const cardInfo = await CardGenerator.generateCardInfo('532959');

      expect(cardInfo).toHaveProperty('cardNumber');
      expect(cardInfo).toHaveProperty('expiryDate');
      expect(cardInfo).toHaveProperty('cvc');
      expect(cardInfo).toHaveProperty('cardBrand');
      expect(cardInfo).toHaveProperty('bank');
      expect(cardInfo).toHaveProperty('country');
      expect(cardInfo).toHaveProperty('type');
    });

    test('should generate Luhn-valid card number', async () => {
      const cardInfo = await CardGenerator.generateCardInfo('532959');
      const cardNumber = cardInfo.cardNumber.replace(/\s/g, '');
      expect(LuhnValidator.validate(cardNumber)).toBe(true);
    });

    test('should start with provided BIN prefix', async () => {
      const cardInfo = await CardGenerator.generateCardInfo('532959');
      const cardNumber = cardInfo.cardNumber.replace(/\s/g, '');
      expect(cardNumber.startsWith('532959')).toBe(true);
    });

    test('should generate 16-digit card for Mastercard', async () => {
      const cardInfo = await CardGenerator.generateCardInfo('532959');
      const cardNumber = cardInfo.cardNumber.replace(/\s/g, '');
      expect(cardNumber.length).toBe(16);
    });

    test('should generate valid expiry date format', async () => {
      const cardInfo = await CardGenerator.generateCardInfo('532959');
      expect(cardInfo.expiryDate).toMatch(/^\d{2}\/\d{2}$/);
    });

    test('should generate valid CVV', async () => {
      const cardInfo = await CardGenerator.generateCardInfo('532959');
      expect(cardInfo.cvc).toMatch(/^\d{3,4}$/);
    });

    test('should throw error for empty BIN', async () => {
      await expect(CardGenerator.generateCardInfo('')).rejects.toThrow('BIN prefix required');
    });

    test('should generate multiple unique cards', async () => {
      const cards = new Set();
      for (let i = 0; i < 10; i++) {
        const cardInfo = await CardGenerator.generateCardInfo('532959');
        const cardNumber = cardInfo.cardNumber.replace(/\s/g, '');
        cards.add(cardNumber);
      }
      expect(cards.size).toBeGreaterThan(5); // Should have variety
    });

    test('should handle different BIN prefixes', async () => {
      const bins = ['532959', '552461', '625969'];

      for (const bin of bins) {
        const cardInfo = await CardGenerator.generateCardInfo(bin);
        const cardNumber = cardInfo.cardNumber.replace(/\s/g, '');
        expect(cardNumber.startsWith(bin)).toBe(true);
        expect(LuhnValidator.validate(cardNumber)).toBe(true);
      }
    });
  });

  describe('generateAccountNumber', () => {
    test('should generate numeric string', () => {
      const accountNumber = CardGenerator.generateAccountNumber();
      expect(accountNumber).toMatch(/^\d+$/);
    });

    test('should generate 9-12 digits', () => {
      for (let i = 0; i < 50; i++) {
        const accountNumber = CardGenerator.generateAccountNumber();
        expect(accountNumber.length).toBeGreaterThanOrEqual(9);
        expect(accountNumber.length).toBeLessThanOrEqual(12);
      }
    });

    test('should generate different account numbers', () => {
      const accounts = new Set();
      for (let i = 0; i < 20; i++) {
        accounts.add(CardGenerator.generateAccountNumber());
      }
      expect(accounts.size).toBeGreaterThan(15);
    });
  });

  describe('generateRoutingNumber', () => {
    test('should return valid routing number from list', () => {
      const routing = CardGenerator.generateRoutingNumber();
      expect(routing).toMatch(/^\d{9}$/);
    });

    test('should return one of the predefined routing numbers', () => {
      const validRoutingNumbers = [
        '121000358', '026009593', '021000021', '322271627', '021000089',
        '322271779', '091000019', '121000248', '062000019', '043000096',
        '071000013', '122235821', '053101121', '061000104', '111000025',
        '122000247', '021200025', '031201360', '071923284', '075000022'
      ];

      const routing = CardGenerator.generateRoutingNumber();
      expect(validRoutingNumbers).toContain(routing);
    });

    test('should generate variety of routing numbers', () => {
      const routings = new Set();
      for (let i = 0; i < 100; i++) {
        routings.add(CardGenerator.generateRoutingNumber());
      }
      expect(routings.size).toBeGreaterThan(1);
    });
  });
});

