/**
 * Tests for Storage Manager
 */

import { StorageManager } from '../../src/utils/storage.js';

describe('StorageManager', () => {
  // In-memory storage for testing
  let mockStorage = {};

  beforeEach(() => {
    // Clear storage before each test
    mockStorage = {};

    // Setup Chrome storage mocks
    global.chrome.storage.local.get.mockImplementation((keys) => {
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockStorage[keys] });
      }
      if (Array.isArray(keys)) {
        const result = {};
        keys.forEach(key => {
          result[key] = mockStorage[key];
        });
        return Promise.resolve(result);
      }
      return Promise.resolve(mockStorage);
    });

    global.chrome.storage.local.set.mockImplementation((items) => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    });

    global.chrome.storage.local.remove.mockImplementation((keys) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(key => {
        delete mockStorage[key];
      });
      return Promise.resolve();
    });

    global.chrome.storage.local.clear.mockImplementation(() => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      return Promise.resolve();
    });
  });

  describe('save', () => {
    test('should save string value', async () => {
      await StorageManager.save('testKey', 'testValue');
      expect(mockStorage['testKey']).toBe('testValue');
    });

    test('should save number value', async () => {
      await StorageManager.save('numberKey', 42);
      expect(mockStorage['numberKey']).toBe(42);
    });

    test('should save object value', async () => {
      const testObj = { name: 'test', value: 123 };
      await StorageManager.save('objectKey', testObj);
      expect(mockStorage['objectKey']).toEqual(testObj);
    });

    test('should save array value', async () => {
      const testArray = [1, 2, 3, 'test'];
      await StorageManager.save('arrayKey', testArray);
      expect(mockStorage['arrayKey']).toEqual(testArray);
    });

    test('should overwrite existing value', async () => {
      await StorageManager.save('key', 'value1');
      await StorageManager.save('key', 'value2');
      expect(mockStorage['key']).toBe('value2');
    });
  });

  describe('load', () => {
    test('should load existing value', async () => {
      mockStorage['testKey'] = 'testValue';
      const value = await StorageManager.load('testKey');
      expect(value).toBe('testValue');
    });

    test('should return null for non-existent key', async () => {
      const value = await StorageManager.load('nonExistentKey');
      expect(value).toBeNull();
    });

    test('should return default value for non-existent key', async () => {
      const value = await StorageManager.load('nonExistentKey', 'defaultValue');
      expect(value).toBe('defaultValue');
    });

    test('should load object value', async () => {
      const testObj = { name: 'test', value: 123 };
      mockStorage['objectKey'] = testObj;
      const value = await StorageManager.load('objectKey');
      expect(value).toEqual(testObj);
    });

    test('should distinguish between undefined and null', async () => {
      mockStorage['nullKey'] = null;
      const value = await StorageManager.load('nullKey', 'default');
      expect(value).toBeNull();
    });
  });

  describe('loadMultiple', () => {
    test('should load multiple keys at once', async () => {
      mockStorage['key1'] = 'value1';
      mockStorage['key2'] = 'value2';
      mockStorage['key3'] = 'value3';

      const values = await StorageManager.loadMultiple(['key1', 'key2', 'key3']);
      expect(values).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      });
    });

    test('should handle mix of existing and non-existing keys', async () => {
      mockStorage['existingKey'] = 'existingValue';

      const values = await StorageManager.loadMultiple(['existingKey', 'nonExistingKey']);
      expect(values.existingKey).toBe('existingValue');
      expect(values.nonExistingKey).toBeUndefined();
    });

    test('should return empty object for empty array', async () => {
      const values = await StorageManager.loadMultiple([]);
      expect(values).toEqual({});
    });
  });

  describe('remove', () => {
    test('should remove existing key', async () => {
      mockStorage['testKey'] = 'testValue';
      await StorageManager.remove('testKey');
      expect(mockStorage['testKey']).toBeUndefined();
    });

    test('should not throw error when removing non-existent key', async () => {
      await expect(StorageManager.remove('nonExistentKey')).resolves.not.toThrow();
    });

    test('should only remove specified key', async () => {
      mockStorage['key1'] = 'value1';
      mockStorage['key2'] = 'value2';

      await StorageManager.remove('key1');
      expect(mockStorage['key1']).toBeUndefined();
      expect(mockStorage['key2']).toBe('value2');
    });
  });

  describe('clear', () => {
    test('should clear all storage', async () => {
      mockStorage['key1'] = 'value1';
      mockStorage['key2'] = 'value2';
      mockStorage['key3'] = 'value3';

      await StorageManager.clear();
      expect(mockStorage).toEqual({});
    });

    test('should work on already empty storage', async () => {
      await StorageManager.clear();
      expect(mockStorage).toEqual({});
    });
  });

  describe('Integration tests', () => {
    test('should save and load value correctly', async () => {
      await StorageManager.save('testKey', 'testValue');
      const value = await StorageManager.load('testKey');
      expect(value).toBe('testValue');
    });

    test('should save, remove, and verify deletion', async () => {
      await StorageManager.save('testKey', 'testValue');
      await StorageManager.remove('testKey');
      const value = await StorageManager.load('testKey');
      expect(value).toBeNull();
    });

    test('should handle complex workflow', async () => {
      // Save multiple values
      await StorageManager.save('bin', '532959');
      await StorageManager.save('quantity', 10);
      await StorageManager.save('settings', { theme: 'dark', auto: true });

      // Load them back
      const values = await StorageManager.loadMultiple(['bin', 'quantity', 'settings']);
      expect(values.bin).toBe('532959');
      expect(values.quantity).toBe(10);
      expect(values.settings).toEqual({ theme: 'dark', auto: true });

      // Remove one
      await StorageManager.remove('quantity');
      const quantityValue = await StorageManager.load('quantity');
      expect(quantityValue).toBeNull();

      // Others should still exist
      const binValue = await StorageManager.load('bin');
      expect(binValue).toBe('532959');
    });
  });
});

