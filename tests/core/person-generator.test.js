/**
 * Tests for Person Generator
 */

import { PersonGenerator } from '../../src/core/person-generator.js';

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

describe('PersonGenerator', () => {
  describe('generate', () => {
    test('should generate complete person information', () => {
      const faker = createMockFaker();
      const person = PersonGenerator.generate(faker);

      expect(person).toHaveProperty('fullName');
      expect(person).toHaveProperty('country');
      expect(person).toHaveProperty('province');
      expect(person).toHaveProperty('city');
      expect(person).toHaveProperty('addressLine2');
    });

    test('should set country to US', () => {
      const faker = createMockFaker();
      const person = PersonGenerator.generate(faker);

      expect(person.country).toBe('US');
    });

    test('should generate full name from faker', () => {
      const faker = createMockFaker();
      const person = PersonGenerator.generate(faker);

      expect(person.fullName).toBe('John Smith');
    });

    test('should generate province (state abbreviation)', () => {
      const faker = createMockFaker();
      const person = PersonGenerator.generate(faker);

      expect(person.province).toBe('CA');
    });

    test('should generate city from faker', () => {
      const faker = createMockFaker();
      const person = PersonGenerator.generate(faker);

      expect(person.city).toBe('Los Angeles');
    });

    test('should generate address line 2', () => {
      const faker = createMockFaker();
      const person = PersonGenerator.generate(faker);

      expect(person.addressLine2).toBe('Apt 123');
    });

    test('should set faker locale to en', () => {
      const faker = createMockFaker();
      faker.locale = 'zh_CN';
      PersonGenerator.generate(faker);

      expect(faker.locale).toBe('en');
    });

    test('should handle different faker responses', () => {
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

      const person = PersonGenerator.generate(customFaker);

      expect(person.fullName).toBe('Jane Doe');
      expect(person.province).toBe('NY');
      expect(person.city).toBe('New York');
      expect(person.addressLine2).toBe('Suite 500');
    });

    test('should generate multiple unique persons with different faker calls', () => {
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

      const person1 = PersonGenerator.generate(dynamicFaker);
      const person2 = PersonGenerator.generate(dynamicFaker);

      expect(person1.fullName).not.toBe(person2.fullName);
    });
  });

  describe('getStateAbbr', () => {
    test('should convert California to CA', () => {
      expect(PersonGenerator.getStateAbbr('California')).toBe('CA');
    });

    test('should convert New York to NY', () => {
      expect(PersonGenerator.getStateAbbr('New York')).toBe('NY');
    });

    test('should convert Texas to TX', () => {
      expect(PersonGenerator.getStateAbbr('Texas')).toBe('TX');
    });

    test('should convert Florida to FL', () => {
      expect(PersonGenerator.getStateAbbr('Florida')).toBe('FL');
    });

    test('should handle all 50 states', () => {
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

      for (const [state, abbr] of Object.entries(testStates)) {
        expect(PersonGenerator.getStateAbbr(state)).toBe(abbr);
      }
    });

    test('should return original string if state not found', () => {
      expect(PersonGenerator.getStateAbbr('Unknown State')).toBe('Unknown State');
    });

    test('should return abbreviation if already abbreviated', () => {
      expect(PersonGenerator.getStateAbbr('CA')).toBe('CA');
      expect(PersonGenerator.getStateAbbr('NY')).toBe('NY');
    });

    test('should handle empty string', () => {
      expect(PersonGenerator.getStateAbbr('')).toBe('');
    });

    test('should be case-sensitive', () => {
      expect(PersonGenerator.getStateAbbr('california')).toBe('california');
      expect(PersonGenerator.getStateAbbr('CALIFORNIA')).toBe('CALIFORNIA');
    });
  });
});

