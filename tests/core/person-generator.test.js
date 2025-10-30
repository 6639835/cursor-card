/**
 * Tests for Person Generator
 */

import { PersonGenerator } from '../../src/core/person-generator.js';

// Mock names database
const mockNamesDatabase = {
  firstNames: {
    male: ['James', 'John', 'Robert', 'Michael', 'William'],
    female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara']
  },
  lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones']
};

// Mock faker object
const createMockFaker = () => ({
  locale: 'en_US',
  name: {
    findName: () => 'John Smith'
  },
  address: {
    stateAbbr: () => 'CA',
    city: () => 'Los Angeles',
    secondaryAddress: () => 'Apt 123'
  }
});

// Mock fetch for loading names database
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockNamesDatabase)
  })
);

describe('PersonGenerator', () => {
  beforeEach(() => {
    // Reset the static namesDatabase before each test
    PersonGenerator.namesDatabase = null;
    fetch.mockClear();
  });

  describe('loadNamesDatabase', () => {
    test('should load names database from file', async () => {
      const db = await PersonGenerator.loadNamesDatabase();

      expect(db).toEqual(mockNamesDatabase);
      expect(db.firstNames.male).toContain('James');
      expect(db.lastNames).toContain('Smith');
    });

    test('should cache database after first load', async () => {
      await PersonGenerator.loadNamesDatabase();
      await PersonGenerator.loadNamesDatabase();

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should handle fetch error gracefully', async () => {
      fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

      const db = await PersonGenerator.loadNamesDatabase();

      expect(db).toBeNull();
    });
  });

  describe('generateFullName', () => {
    test('should generate a full name from database', async () => {
      const fullName = await PersonGenerator.generateFullName();

      expect(fullName).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
      expect(typeof fullName).toBe('string');
    });

    test('should generate different names on multiple calls', async () => {
      const names = new Set();
      for (let i = 0; i < 10; i++) {
        const name = await PersonGenerator.generateFullName();
        names.add(name);
      }

      // Should have at least a few different names (allowing for some duplicates due to randomness)
      expect(names.size).toBeGreaterThan(1);
    });

    test('should return fallback name if database fails to load', async () => {
      fetch.mockImplementationOnce(() => Promise.reject(new Error('Load failed')));
      PersonGenerator.namesDatabase = null;

      const fullName = await PersonGenerator.generateFullName();

      expect(fullName).toBe('John Doe');
    });
  });

  describe('generate', () => {
    test('should generate complete person information', async () => {
      const faker = createMockFaker();
      const person = await PersonGenerator.generate(faker);

      expect(person).toHaveProperty('fullName');
      expect(person).toHaveProperty('country');
      expect(person).toHaveProperty('province');
      expect(person).toHaveProperty('city');
      expect(person).toHaveProperty('addressLine2');
    });

    test('should set country to US', async () => {
      const faker = createMockFaker();
      const person = await PersonGenerator.generate(faker);

      expect(person.country).toBe('US');
    });

    test('should generate full name from database', async () => {
      const faker = createMockFaker();
      const person = await PersonGenerator.generate(faker);

      expect(person.fullName).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
      expect(typeof person.fullName).toBe('string');
    });

    test('should generate province (state abbreviation)', async () => {
      const faker = createMockFaker();
      const person = await PersonGenerator.generate(faker);

      expect(person.province).toBe('CA');
    });

    test('should generate city from faker', async () => {
      const faker = createMockFaker();
      const person = await PersonGenerator.generate(faker);

      expect(person.city).toBe('Los Angeles');
    });

    test('should generate address line 2', async () => {
      const faker = createMockFaker();
      const person = await PersonGenerator.generate(faker);

      expect(person.addressLine2).toBe('Apt 123');
    });

    test('should set faker locale to en', async () => {
      const faker = createMockFaker();
      faker.locale = 'zh_CN';
      await PersonGenerator.generate(faker);

      expect(faker.locale).toBe('en');
    });

    test('should handle different faker responses', async () => {
      const customFaker = {
        locale: 'es',
        name: {
          findName: () => 'Jane Doe'
        },
        address: {
          stateAbbr: () => 'NY',
          city: () => 'New York',
          secondaryAddress: () => 'Suite 500'
        }
      };

      const person = await PersonGenerator.generate(customFaker);

      expect(person.province).toBe('NY');
      expect(person.city).toBe('New York');
      expect(person.addressLine2).toBe('Suite 500');
    });

    test('should generate multiple unique persons with different faker calls', async () => {
      let callCount = 0;
      const dynamicFaker = {
        locale: 'en',
        name: {
          findName: () => `Person ${callCount++}`
        },
        address: {
          stateAbbr: () => ['CA', 'NY', 'TX'][callCount % 3],
          city: () => ['LA', 'NYC', 'Houston'][callCount % 3],
          secondaryAddress: () => `Unit ${callCount}`
        }
      };

      const person1 = await PersonGenerator.generate(dynamicFaker);
      const person2 = await PersonGenerator.generate(dynamicFaker);

      expect(person1.fullName).not.toBe(person2.fullName);
    });
  });

  describe('loadStatesDatabase', () => {
    beforeEach(() => {
      PersonGenerator.statesDatabase = null;
      // Mock states database
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            states: {
              'California': 'CA',
              'New York': 'NY',
              'Texas': 'TX',
              'Florida': 'FL',
              'Alabama': 'AL'
            }
          })
        })
      );
    });

    test('should load states database from file', async () => {
      const db = await PersonGenerator.loadStatesDatabase();

      expect(db).toHaveProperty('states');
      expect(db.states.California).toBe('CA');
      expect(db.states['New York']).toBe('NY');
    });

    test('should cache database after first load', async () => {
      await PersonGenerator.loadStatesDatabase();
      await PersonGenerator.loadStatesDatabase();

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should handle fetch error gracefully', async () => {
      fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

      const db = await PersonGenerator.loadStatesDatabase();

      expect(db).toBeNull();
    });
  });

  describe('getStateAbbr', () => {
    beforeEach(() => {
      PersonGenerator.statesDatabase = null;
      // Mock states database
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({
            states: {
              'California': 'CA',
              'New York': 'NY',
              'Texas': 'TX',
              'Florida': 'FL',
              'Alabama': 'AL',
              'Alaska': 'AK',
              'Arizona': 'AZ',
              'Arkansas': 'AR',
              'Connecticut': 'CT',
              'Delaware': 'DE',
              'Georgia': 'GA',
              'Hawaii': 'HI',
              'Illinois': 'IL',
              'Washington': 'WA',
              'Wyoming': 'WY'
            }
          })
        })
      );
    });

    test('should convert California to CA', async () => {
      const abbr = await PersonGenerator.getStateAbbr('California');
      expect(abbr).toBe('CA');
    });

    test('should convert New York to NY', async () => {
      const abbr = await PersonGenerator.getStateAbbr('New York');
      expect(abbr).toBe('NY');
    });

    test('should convert Texas to TX', async () => {
      const abbr = await PersonGenerator.getStateAbbr('Texas');
      expect(abbr).toBe('TX');
    });

    test('should convert Florida to FL', async () => {
      const abbr = await PersonGenerator.getStateAbbr('Florida');
      expect(abbr).toBe('FL');
    });

    test('should handle multiple states', async () => {
      const testStates = {
        'Alabama': 'AL',
        'Alaska': 'AK',
        'Arizona': 'AZ',
        'Arkansas': 'AR',
        'Connecticut': 'CT',
        'Delaware': 'DE',
        'Georgia': 'GA',
        'Hawaii': 'HI',
        'Illinois': 'IL',
        'Washington': 'WA',
        'Wyoming': 'WY'
      };

      for (const [state, expectedAbbr] of Object.entries(testStates)) {
        const abbr = await PersonGenerator.getStateAbbr(state);
        expect(abbr).toBe(expectedAbbr);
      }
    });

    test('should return original string if state not found', async () => {
      const abbr = await PersonGenerator.getStateAbbr('Unknown State');
      expect(abbr).toBe('Unknown State');
    });

    test('should return abbreviation if already abbreviated', async () => {
      const ca = await PersonGenerator.getStateAbbr('CA');
      const ny = await PersonGenerator.getStateAbbr('NY');
      expect(ca).toBe('CA');
      expect(ny).toBe('NY');
    });

    test('should handle empty string', async () => {
      const result = await PersonGenerator.getStateAbbr('');
      expect(result).toBe('');
    });

    test('should be case-sensitive', async () => {
      const lower = await PersonGenerator.getStateAbbr('california');
      const upper = await PersonGenerator.getStateAbbr('CALIFORNIA');
      expect(lower).toBe('california');
      expect(upper).toBe('CALIFORNIA');
    });

    test('should return original string if database fails to load', async () => {
      fetch.mockImplementationOnce(() => Promise.reject(new Error('Load failed')));
      PersonGenerator.statesDatabase = null;

      const abbr = await PersonGenerator.getStateAbbr('California');
      expect(abbr).toBe('California');
    });
  });
});

