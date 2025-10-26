/**
 * Markov Chain Generator
 * Generates realistic digit sequences based on transition probabilities
 */

export class MarkovChainGenerator {
  /**
   * Transition probability matrix
   * Each row represents the probability of transitioning from one digit to another
   */
  static TRANSITION_MATRIX = {
    0: [0.08, 0.11, 0.12, 0.10, 0.09, 0.11, 0.10, 0.09, 0.10, 0.10],
    1: [0.10, 0.08, 0.11, 0.11, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10],
    2: [0.11, 0.10, 0.08, 0.10, 0.11, 0.10, 0.10, 0.10, 0.10, 0.10],
    3: [0.10, 0.11, 0.10, 0.08, 0.10, 0.11, 0.10, 0.10, 0.10, 0.10],
    4: [0.09, 0.10, 0.11, 0.10, 0.08, 0.10, 0.11, 0.10, 0.11, 0.10],
    5: [0.11, 0.10, 0.10, 0.11, 0.10, 0.08, 0.10, 0.10, 0.10, 0.10],
    6: [0.10, 0.10, 0.10, 0.10, 0.11, 0.10, 0.08, 0.11, 0.10, 0.10],
    7: [0.09, 0.10, 0.10, 0.10, 0.10, 0.10, 0.11, 0.08, 0.11, 0.11],
    8: [0.10, 0.10, 0.10, 0.10, 0.11, 0.10, 0.10, 0.11, 0.08, 0.10],
    9: [0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.11, 0.10, 0.09]
  };

  /**
   * Generate the next digit based on the previous digit using Markov chain
   * @param {string} previousSegment - Previously generated segment
   * @param {string} binPrefix - BIN prefix for fallback
   * @returns {number} Next digit (0-9)
   */
  static getNextDigit(previousSegment, binPrefix) {
    const lastDigit = previousSegment.length > 0
      ? parseInt(previousSegment[previousSegment.length - 1])
      : parseInt(binPrefix[binPrefix.length - 1]);

    const probabilities = this.TRANSITION_MATRIX[lastDigit] || this.TRANSITION_MATRIX[5];
    const random = Math.random();
    let cumulative = 0;

    for (let digit = 0; digit < probabilities.length; digit++) {
      cumulative += probabilities[digit];
      if (random < cumulative) {
        return digit;
      }
    }

    return 5; // Fallback
  }

  /**
   * Generate a realistic random digit with natural distribution
   * @returns {number} Random digit (0-9)
   */
  static getRealisticRandomDigit() {
    const probabilities = [
      0.09, 0.10, 0.11, 0.10, 0.10,
      0.11, 0.10, 0.09, 0.10, 0.10
    ];

    const random = Math.random();
    let cumulative = 0;

    for (let digit = 0; digit < probabilities.length; digit++) {
      cumulative += probabilities[digit];
      if (random < cumulative) {
        return digit;
      }
    }

    return 5; // Fallback
  }
}

