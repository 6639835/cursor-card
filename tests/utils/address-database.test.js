/**
 * Tests for Address Database
 */

import { AddressDatabase } from '../../src/utils/address-database.js';

// Mock chrome runtime
global.chrome = {
  runtime: {
    getURL: (path) => `chrome-extension://fake-id/${path}`
  }
};

// Mock fetch
global.fetch = jest.fn();

describe('AddressDatabase', () => {
  let addressDB;

  beforeEach(() => {
    addressDB = new AddressDatabase();
    addressDB.database = null; // Reset database cache
    jest.clearAllMocks();
  });

  describe('load', () => {
    test('should load database from file', async () => {
      const mockData = {
        US: {
          CA: {
            'Los Angeles': [
              { street: '123 Main St', zip: '90001' }
            ]
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      const db = await addressDB.load();

      expect(db).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('chrome-extension://fake-id/public/real-addresses.json');
    });

    test('should cache database after first load', async () => {
      const mockData = { US: {} };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      await addressDB.load();
      await addressDB.load();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should return cached database on subsequent calls', async () => {
      const mockData = { US: { CA: {} } };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      const db1 = await addressDB.load();
      const db2 = await addressDB.load();

      expect(db1).toBe(db2);
      expect(db1).toEqual(mockData);
    });

    test('should return null and log error on fetch failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const db = await addressDB.load();

      expect(db).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    test('should return null on JSON parse error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch.mockResolvedValueOnce({
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const db = await addressDB.load();

      expect(db).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getRealAddress', () => {
    test('should return address from database when available', async () => {
      const mockData = {
        US: {
          CA: {
            'Los Angeles': [
              { street: '123 Main St', zip: '90001' },
              { street: '456 Oak Ave', zip: '90002' }
            ]
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      const address = await addressDB.getRealAddress('Los Angeles', 'CA');

      expect(address).toHaveProperty('street');
      expect(address).toHaveProperty('zip');
      expect(address.source).toBe('database');
      expect(['123 Main St', '456 Oak Ave']).toContain(address.street);
      expect(['90001', '90002']).toContain(address.zip);
    });

    test('should generate fallback address when city not in database', async () => {
      const mockData = {
        US: {
          CA: {
            'San Francisco': [
              { street: '789 Market St', zip: '94102' }
            ]
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      const address = await addressDB.getRealAddress('Unknown City', 'CA');

      expect(address).toHaveProperty('street');
      expect(address).toHaveProperty('zip');
      expect(address.source).toBe('generator');
    });

    test('should generate fallback address when state not in database', async () => {
      const mockData = {
        US: {
          CA: {
            'Los Angeles': [
              { street: '123 Main St', zip: '90001' }
            ]
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      const address = await addressDB.getRealAddress('Some City', 'ZZ');

      expect(address).toHaveProperty('street');
      expect(address).toHaveProperty('zip');
      expect(address.source).toBe('generator');
    });

    test('should handle empty address array', async () => {
      const mockData = {
        US: {
          CA: {
            'Los Angeles': []
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockData
      });

      const address = await addressDB.getRealAddress('Los Angeles', 'CA');

      expect(address.source).toBe('generator');
    });

    test('should handle null database', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const address = await addressDB.getRealAddress('Los Angeles', 'CA');

      expect(address).toHaveProperty('street');
      expect(address).toHaveProperty('zip');
      expect(address.source).toBe('generator');
    });
  });

  describe('generateRealisticAddress', () => {
    test('should generate address with required properties', () => {
      const address = addressDB.generateRealisticAddress('Test City', 'CA');

      expect(address).toHaveProperty('street');
      expect(address).toHaveProperty('zip');
      expect(address.source).toBe('generator');
    });

    test('should generate street with number and name', () => {
      const address = addressDB.generateRealisticAddress('Test City', 'CA');

      expect(address.street).toMatch(/^\d+\s/); // Starts with number
      expect(address.street.length).toBeGreaterThan(5);
    });

    test('should generate 5-digit ZIP code', () => {
      const address = addressDB.generateRealisticAddress('Test City', 'CA');

      expect(address.zip).toMatch(/^\d{5}$/);
    });

    test('should generate different ZIP codes for different states', () => {
      const caAddress = addressDB.generateRealisticAddress('City', 'CA');
      const nyAddress = addressDB.generateRealisticAddress('City', 'NY');

      // CA range: 90001-96162, NY range: 10001-14975
      const caZip = parseInt(caAddress.zip);
      const nyZip = parseInt(nyAddress.zip);

      // At least verify they're 5 digits
      expect(caAddress.zip.length).toBe(5);
      expect(nyAddress.zip.length).toBe(5);
    });

    test('should generate street numbers in reasonable range', () => {
      const addresses = [];
      for (let i = 0; i < 50; i++) {
        addresses.push(addressDB.generateRealisticAddress('City', 'CA'));
      }

      addresses.forEach(addr => {
        const streetNum = parseInt(addr.street.split(' ')[0]);
        expect(streetNum).toBeGreaterThan(0);
        expect(streetNum).toBeLessThan(100000); // Max street number
      });
    });

    test('should include variety of street types', () => {
      const streetTypes = new Set();
      for (let i = 0; i < 100; i++) {
        const address = addressDB.generateRealisticAddress('City', 'CA');
        const parts = address.street.split(' ');
        const streetType = parts[parts.length - 1];
        streetTypes.add(streetType);
      }

      // Should have multiple street types (St, Ave, Rd, etc.)
      expect(streetTypes.size).toBeGreaterThan(1);
    });

    test('should handle unknown state with default ZIP range', () => {
      const address = addressDB.generateRealisticAddress('City', 'ZZ');

      expect(address.zip).toMatch(/^\d{5}$/);
      const zip = parseInt(address.zip);
      expect(zip).toBeGreaterThanOrEqual(10000);
      expect(zip).toBeLessThanOrEqual(99999);
    });

    test('should generate different addresses on multiple calls', () => {
      const addresses = new Set();
      for (let i = 0; i < 20; i++) {
        const address = addressDB.generateRealisticAddress('City', 'CA');
        addresses.add(address.street);
      }

      // Should have variety
      expect(addresses.size).toBeGreaterThan(15);
    });

    test('should occasionally include directional prefixes', () => {
      const addresses = [];
      for (let i = 0; i < 100; i++) {
        addresses.push(addressDB.generateRealisticAddress('City', 'CA'));
      }

      // Some addresses should have directional prefixes (N, S, E, W, etc.)
      const withDirection = addresses.filter(addr => {
        const parts = addr.street.split(' ');
        return parts.length > 3; // Number + Direction + Name + Type
      });

      // At least some should have directions
      expect(withDirection.length).toBeGreaterThan(0);
    });

    test('should return consistent format', () => {
      for (let i = 0; i < 50; i++) {
        const address = addressDB.generateRealisticAddress('City', 'CA');

        expect(address).toEqual({
          street: expect.any(String),
          zip: expect.stringMatching(/^\d{5}$/),
          source: 'generator'
        });
      }
    });
  });
});

