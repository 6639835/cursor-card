/**
 * Tests for BIN Database
 */

import { BINDatabase } from '../../src/utils/bin-database.js';

// Mock chrome runtime
global.chrome = {
  runtime: {
    getURL: (path) => `chrome-extension://fake-id/${path}`
  }
};

// Mock fetch
global.fetch = jest.fn();

describe('BINDatabase', () => {
  let binDB;

  beforeEach(() => {
    binDB = new BINDatabase();
    binDB.database = null; // Reset cache
    jest.clearAllMocks();
  });

  describe('load', () => {
    test('should load database from file', async () => {
      const mockData = {
        bins: {
          '532959': {
            brand: 'Mastercard',
            bank: 'Citibank Hong Kong',
            country: 'HK',
            countryName: 'Hong Kong',
            length: 16,
            cvvLength: 3,
            type: 'credit'
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      const db = await binDB.load();

      expect(db).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('chrome-extension://fake-id/public/bin-database.json');
    });

    test('should cache database after first load', async () => {
      const mockData = { bins: {} };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      await binDB.load();
      await binDB.load();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should return cached database on subsequent calls', async () => {
      const mockData = { bins: { '4111': {} } };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      const db1 = await binDB.load();
      const db2 = await binDB.load();

      expect(db1).toBe(db2);
    });

    test('should return null on fetch failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const db = await binDB.load();

      expect(db).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('detectCardBrand', () => {
    const mockDatabase = {
      bins: {
        '532959': {
          brand: 'Mastercard',
          bank: 'Citibank Hong Kong',
          country: 'HK',
          length: 16,
          cvvLength: 3,
          type: 'credit'
        },
        '5524': {
          brand: 'Mastercard',
          bank: 'Test Bank',
          country: 'US',
          length: 16,
          cvvLength: 3,
          type: 'debit'
        },
        '41': {
          brand: 'Visa',
          bank: 'Generic Visa',
          country: 'US',
          length: 16,
          cvvLength: 3,
          type: 'credit'
        }
      }
    };

    beforeEach(() => {
      global.fetch.mockResolvedValue({
        json: async () => mockDatabase
      });
    });

    test('should find exact BIN match', async () => {
      const brand = await binDB.detectCardBrand('532959');

      expect(brand.name).toBe('Mastercard');
      expect(brand.bank).toBe('Citibank Hong Kong');
      expect(brand.country).toBe('HK');
      expect(brand.length).toBe(16);
      expect(brand.cvvLength).toBe(3);
      expect(brand.type).toBe('credit');
    });

    test('should find 4-digit prefix match', async () => {
      const brand = await binDB.detectCardBrand('5524612345');

      expect(brand.name).toBe('Mastercard');
      expect(brand.bank).toBe('Test Bank');
    });

    test('should find 2-digit prefix match', async () => {
      const brand = await binDB.detectCardBrand('4199999999');

      expect(brand.name).toBe('Visa');
      expect(brand.bank).toBe('Generic Visa');
    });

    test('should fall back to traditional rules for Visa', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ bins: {} })
      });

      const brand = await binDB.detectCardBrand('4111111111111111');

      expect(brand.name).toBe('Visa');
      expect(brand.length).toBe(16);
      expect(brand.cvvLength).toBe(3);
    });

    test('should detect MasterCard (51-55)', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ bins: {} })
      });

      for (const prefix of ['51', '52', '53', '54', '55']) {
        const brand = await binDB.detectCardBrand(prefix + '00000000000000');
        expect(brand.name).toBe('MasterCard');
        expect(brand.length).toBe(16);
      }
    });

    test('should detect MasterCard (22-27)', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ bins: {} })
      });

      for (const prefix of ['22', '23', '24', '25', '26', '27']) {
        const brand = await binDB.detectCardBrand(prefix + '00000000000000');
        expect(brand.name).toBe('MasterCard');
      }
    });

    test('should detect American Express', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ bins: {} })
      });

      const brand34 = await binDB.detectCardBrand('340000000000000');
      const brand37 = await binDB.detectCardBrand('370000000000000');

      expect(brand34.name).toBe('American Express');
      expect(brand34.length).toBe(15);
      expect(brand34.cvvLength).toBe(4);

      expect(brand37.name).toBe('American Express');
      expect(brand37.length).toBe(15);
      expect(brand37.cvvLength).toBe(4);
    });

    test('should detect Discover', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ bins: {} })
      });

      const brand6011 = await binDB.detectCardBrand('6011000000000000');
      const brand622 = await binDB.detectCardBrand('6220000000000000');
      const brand644 = await binDB.detectCardBrand('6440000000000000');
      const brand65 = await binDB.detectCardBrand('6500000000000000');

      expect(brand6011.name).toBe('Discover');
      expect(brand622.name).toBe('Discover');
      expect(brand644.name).toBe('Discover');
      expect(brand65.name).toBe('Discover');
    });

    test('should detect Diners Club', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ bins: {} })
      });

      const brand36 = await binDB.detectCardBrand('36000000000000');
      const brand38 = await binDB.detectCardBrand('38000000000000');

      expect(brand36.name).toBe('Diners Club');
      expect(brand36.length).toBe(14);

      expect(brand38.name).toBe('Diners Club');
      expect(brand38.length).toBe(14);
    });

    test('should detect JCB', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ bins: {} })
      });

      const brand352 = await binDB.detectCardBrand('3520000000000000');
      const brand358 = await binDB.detectCardBrand('3580000000000000');

      expect(brand352.name).toBe('JCB');
      expect(brand352.country).toBe('JP');

      expect(brand358.name).toBe('JCB');
      expect(brand358.country).toBe('JP');
    });

    test('should detect UnionPay', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ bins: {} })
      });

      const brand = await binDB.detectCardBrand('6200000000000000');

      expect(brand.name).toBe('UnionPay');
      expect(brand.country).toBe('CN');
    });

    test('should return Unknown for unrecognized BIN', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ bins: {} })
      });

      const brand = await binDB.detectCardBrand('9900000000000000');

      expect(brand.name).toBe('Unknown');
      expect(brand.length).toBe(16);
      expect(brand.cvvLength).toBe(3);
      expect(brand.type).toBe('credit');
    });

    test('should handle null database gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const brand = await binDB.detectCardBrand('4111111111111111');

      expect(brand.name).toBe('Visa');
      consoleErrorSpy.mockRestore();
    });

    test('should convert BIN to string', async () => {
      const brand = await binDB.detectCardBrand(532959);

      expect(brand.name).toBe('Mastercard');
    });
  });

  describe('_formatBrandInfo', () => {
    test('should format database info correctly', () => {
      const dbInfo = {
        brand: 'Visa',
        bank: 'Chase',
        country: 'US',
        length: 16,
        cvvLength: 3,
        type: 'debit'
      };

      const formatted = binDB._formatBrandInfo(dbInfo);

      expect(formatted).toEqual({
        name: 'Visa',
        bank: 'Chase',
        country: 'US',
        length: 16,
        cvvLength: 3,
        type: 'debit'
      });
    });

    test('should map brand to name property', () => {
      const dbInfo = {
        brand: 'Mastercard',
        bank: 'Test',
        country: 'UK',
        length: 16,
        cvvLength: 3,
        type: 'credit'
      };

      const formatted = binDB._formatBrandInfo(dbInfo);

      expect(formatted.name).toBe('Mastercard');
      expect(formatted).not.toHaveProperty('brand');
    });
  });

  describe('_detectByTraditionalRules', () => {
    test('should detect all Visa patterns', () => {
      const visaBins = ['4000', '4111', '4999'];

      visaBins.forEach(bin => {
        const brand = binDB._detectByTraditionalRules(bin);
        expect(brand.name).toBe('Visa');
        expect(brand.length).toBe(16);
        expect(brand.cvvLength).toBe(3);
      });
    });

    test('should detect all MasterCard patterns', () => {
      const mcBins = ['5100', '5500', '2200', '2700'];

      mcBins.forEach(bin => {
        const brand = binDB._detectByTraditionalRules(bin);
        expect(brand.name).toBe('MasterCard');
      });
    });

    test('should detect all Amex patterns', () => {
      const amexBins = ['340000', '370000'];

      amexBins.forEach(bin => {
        const brand = binDB._detectByTraditionalRules(bin);
        expect(brand.name).toBe('American Express');
        expect(brand.length).toBe(15);
        expect(brand.cvvLength).toBe(4);
      });
    });

    test('should set default values for unknown cards', () => {
      const brand = binDB._detectByTraditionalRules('9999');

      expect(brand).toEqual({
        name: 'Unknown',
        length: 16,
        cvvLength: 3,
        bank: 'Unknown',
        country: 'US',
        type: 'credit'
      });
    });

    test('should detect edge cases', () => {
      // Test boundary conditions
      const brand510 = binDB._detectByTraditionalRules('510000');
      const brand559 = binDB._detectByTraditionalRules('559999');

      expect(brand510.name).toBe('MasterCard');
      expect(brand559.name).toBe('MasterCard');
    });
  });
});

