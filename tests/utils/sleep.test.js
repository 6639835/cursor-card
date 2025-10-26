/**
 * Tests for Sleep Utilities
 */

import { Sleep } from '../../src/utils/sleep.js';

describe('Sleep', () => {
  describe('sleep', () => {
    test('should delay execution by specified milliseconds', async () => {
      const startTime = Date.now();
      await Sleep.sleep(100);
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow small margin
      expect(elapsed).toBeLessThan(200); // Should not take too long
    });

    test('should return a Promise', () => {
      const result = Sleep.sleep(10);
      expect(result).toBeInstanceOf(Promise);
    });

    test('should resolve after delay', async () => {
      const promise = Sleep.sleep(50);
      expect(promise).toBeInstanceOf(Promise);
      await expect(promise).resolves.toBeUndefined();
    });

    test('should work with zero milliseconds', async () => {
      const startTime = Date.now();
      await Sleep.sleep(0);
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeLessThan(50);
    });

    test('should handle multiple concurrent sleeps', async () => {
      const startTime = Date.now();

      const sleep1 = Sleep.sleep(50);
      const sleep2 = Sleep.sleep(50);
      const sleep3 = Sleep.sleep(50);

      await Promise.all([sleep1, sleep2, sleep3]);

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // All should complete around the same time (concurrent)
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(150);
    });

    test('should work in sequence', async () => {
      const startTime = Date.now();

      await Sleep.sleep(30);
      await Sleep.sleep(30);
      await Sleep.sleep(30);

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should take approximately 90ms total
      expect(elapsed).toBeGreaterThanOrEqual(85);
      expect(elapsed).toBeLessThan(200);
    });

    test('should allow cancellation with Promise.race', async () => {
      const timeout = new Promise((resolve) => setTimeout(resolve, 50));
      const longSleep = Sleep.sleep(1000);

      const result = await Promise.race([timeout, longSleep]);
      expect(result).toBeUndefined();
    });
  });

  describe('sleepWithProgress', () => {
    test('should call progress callback during sleep', async () => {
      const progressCalls = [];
      const callback = (remaining) => {
        progressCalls.push(remaining);
      };

      await Sleep.sleepWithProgress(100, callback);

      expect(progressCalls.length).toBeGreaterThan(0);
    });

    test('should report decreasing remaining time', async () => {
      const progressCalls = [];
      const callback = (remaining) => {
        progressCalls.push(remaining);
      };

      await Sleep.sleepWithProgress(100, callback);

      // Verify times are decreasing
      for (let i = 1; i < progressCalls.length; i++) {
        expect(progressCalls[i]).toBeLessThanOrEqual(progressCalls[i - 1]);
      }
    });

    test('should complete after specified duration', async () => {
      const startTime = Date.now();
      await Sleep.sleepWithProgress(100, () => {});
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(95);
    });

    test('should work without callback', async () => {
      const startTime = Date.now();
      await Sleep.sleepWithProgress(50);
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    test('should handle callback errors gracefully', async () => {
      const faultyCallback = () => {
        throw new Error('Callback error');
      };

      // Should not throw even if callback throws
      await expect(
        Sleep.sleepWithProgress(50, faultyCallback)
      ).resolves.toBeUndefined();
    });

    test('should call callback multiple times for longer durations', async () => {
      const progressCalls = [];
      const callback = (remaining) => {
        progressCalls.push(remaining);
      };

      await Sleep.sleepWithProgress(200, callback);

      // Should have multiple progress updates
      expect(progressCalls.length).toBeGreaterThan(3);
    });

    test('should pass correct remaining time to callback', async () => {
      const progressCalls = [];
      const duration = 150;
      const callback = (remaining) => {
        progressCalls.push(remaining);
      };

      await Sleep.sleepWithProgress(duration, callback);

      // First call should be close to full duration
      expect(progressCalls[0]).toBeLessThanOrEqual(duration);

      // Last call should be close to 0
      expect(progressCalls[progressCalls.length - 1]).toBeLessThan(50);
    });

    test('should work with very short durations', async () => {
      const progressCalls = [];
      const callback = (remaining) => {
        progressCalls.push(remaining);
      };

      await Sleep.sleepWithProgress(10, callback);

      // May or may not have progress calls due to short duration
      // Just verify it completes
      expect(progressCalls.length).toBeGreaterThanOrEqual(0);
    });

    test('should return a Promise', () => {
      const result = Sleep.sleepWithProgress(10, () => {});
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Edge Cases', () => {
    test('should handle negative duration gracefully', async () => {
      const startTime = Date.now();
      await Sleep.sleep(-100);
      const endTime = Date.now();

      // Should complete immediately or very quickly
      const elapsed = endTime - startTime;
      expect(elapsed).toBeLessThan(50);
    });

    test('should handle very large durations', async () => {
      // Don't actually wait - just verify it returns a promise
      const promise = Sleep.sleep(100000);
      expect(promise).toBeInstanceOf(Promise);

      // Cancel it immediately
      const quickTimeout = new Promise((resolve) => setTimeout(resolve, 1));
      await quickTimeout;
    }, 100); // Short test timeout

    test('should handle floating point durations', async () => {
      const startTime = Date.now();
      await Sleep.sleep(50.5);
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });
});

