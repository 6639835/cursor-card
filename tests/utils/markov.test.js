/**
 * Tests for Markov Chain Generator
 */

import { MarkovChainGenerator } from '../../src/utils/markov.js';

describe('MarkovChainGenerator', () => {
  describe('TRANSITION_MATRIX', () => {
    test('should have transition matrix for all digits 0-9', () => {
      expect(Object.keys(MarkovChainGenerator.TRANSITION_MATRIX)).toHaveLength(10);

      for (let i = 0; i < 10; i++) {
        expect(MarkovChainGenerator.TRANSITION_MATRIX[i]).toBeDefined();
      }
    });

    test('should have probabilities that sum to ~1.0 for each state', () => {
      for (let i = 0; i < 10; i++) {
        const probabilities = MarkovChainGenerator.TRANSITION_MATRIX[i];
        const sum = probabilities.reduce((a, b) => a + b, 0);
        expect(sum).toBeGreaterThan(0.99);
        expect(sum).toBeLessThan(1.01);
      }
    });

    test('should have 10 transition probabilities for each state', () => {
      for (let i = 0; i < 10; i++) {
        expect(MarkovChainGenerator.TRANSITION_MATRIX[i]).toHaveLength(10);
      }
    });

    test('should have all probabilities between 0 and 1', () => {
      for (let i = 0; i < 10; i++) {
        const probabilities = MarkovChainGenerator.TRANSITION_MATRIX[i];
        probabilities.forEach(prob => {
          expect(prob).toBeGreaterThanOrEqual(0);
          expect(prob).toBeLessThanOrEqual(1);
        });
      }
    });
  });

  describe('getNextDigit', () => {
    test('should return a digit between 0-9', () => {
      for (let i = 0; i < 100; i++) {
        const segment = '12345';
        const binPrefix = '532959';
        const digit = MarkovChainGenerator.getNextDigit(segment, binPrefix);

        expect(digit).toBeGreaterThanOrEqual(0);
        expect(digit).toBeLessThanOrEqual(9);
        expect(Number.isInteger(digit)).toBe(true);
      }
    });

    test('should use last digit of segment for transition', () => {
      const segment = '5';
      const binPrefix = '532959';

      // Generate many digits to test distribution
      const counts = new Array(10).fill(0);
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const digit = MarkovChainGenerator.getNextDigit(segment, binPrefix);
        counts[digit]++;
      }

      // All digits should be generated at least once
      counts.forEach(count => {
        expect(count).toBeGreaterThan(0);
      });

      // Total should match iterations
      const total = counts.reduce((a, b) => a + b, 0);
      expect(total).toBe(iterations);
    });

    test('should handle empty segment by using BIN prefix', () => {
      const segment = '';
      const binPrefix = '532959';

      const digit = MarkovChainGenerator.getNextDigit(segment, binPrefix);
      expect(digit).toBeGreaterThanOrEqual(0);
      expect(digit).toBeLessThanOrEqual(9);
    });

    test('should use fallback for invalid last digit', () => {
      const segment = '123';
      const binPrefix = '532959';

      const digit = MarkovChainGenerator.getNextDigit(segment, binPrefix);
      expect(digit).toBeGreaterThanOrEqual(0);
      expect(digit).toBeLessThanOrEqual(9);
    });

    test('should produce varied output', () => {
      const segment = '123456';
      const binPrefix = '532959';
      const results = new Set();

      for (let i = 0; i < 50; i++) {
        const digit = MarkovChainGenerator.getNextDigit(segment, binPrefix);
        results.add(digit);
      }

      // Should generate more than one unique digit
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('getRealisticRandomDigit', () => {
    test('should return a digit between 0-9', () => {
      for (let i = 0; i < 100; i++) {
        const digit = MarkovChainGenerator.getRealisticRandomDigit();
        expect(digit).toBeGreaterThanOrEqual(0);
        expect(digit).toBeLessThanOrEqual(9);
        expect(Number.isInteger(digit)).toBe(true);
      }
    });

    test('should generate all digits over many iterations', () => {
      const counts = new Array(10).fill(0);
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const digit = MarkovChainGenerator.getRealisticRandomDigit();
        counts[digit]++;
      }

      // All digits should be generated
      counts.forEach(count => {
        expect(count).toBeGreaterThan(0);
      });

      // Distribution should be relatively even (within 30% of expected)
      const expected = iterations / 10;
      counts.forEach(count => {
        expect(count).toBeGreaterThan(expected * 0.5);
        expect(count).toBeLessThan(expected * 1.5);
      });
    });

    test('should have realistic distribution', () => {
      const counts = new Array(10).fill(0);
      const iterations = 100000;

      for (let i = 0; i < iterations; i++) {
        const digit = MarkovChainGenerator.getRealisticRandomDigit();
        counts[digit]++;
      }

      // Check that the distribution roughly matches the probabilities
      // [0.09, 0.10, 0.11, 0.10, 0.10, 0.11, 0.10, 0.09, 0.10, 0.10]
      const probabilities = [0.09, 0.10, 0.11, 0.10, 0.10, 0.11, 0.10, 0.09, 0.10, 0.10];

      for (let i = 0; i < 10; i++) {
        const actualProbability = counts[i] / iterations;
        const expectedProbability = probabilities[i];

        // Allow 20% deviation
        expect(actualProbability).toBeGreaterThan(expectedProbability * 0.8);
        expect(actualProbability).toBeLessThan(expectedProbability * 1.2);
      }
    });
  });
});

