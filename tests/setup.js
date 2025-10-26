/**
 * Jest Test Setup
 * Global mocks and configurations for all tests
 */

import { jest, expect, beforeEach } from '@jest/globals';

// Make Jest globals available
global.jest = jest;
global.expect = expect;
global.beforeEach = beforeEach;

// Mock Chrome APIs globally
global.chrome = {
  runtime: {
    getURL: jest.fn((path) => `chrome-extension://fake-extension-id/${path}`),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  }
};

// Mock fetch API
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
// But keep errors and warnings visible
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep warn and error for debugging
  warn: originalConsole.warn,
  error: originalConsole.error
};

// Add custom matchers if needed
expect.extend({
  toBeValidCardNumber(received) {
    const isValid = /^\d{13,19}$/.test(received.replace(/\s/g, ''));
    return {
      message: () => `expected ${received} to be a valid card number`,
      pass: isValid
    };
  },
  toBeValidZipCode(received) {
    const isValid = /^\d{5}(-\d{4})?$/.test(received);
    return {
      message: () => `expected ${received} to be a valid ZIP code`,
      pass: isValid
    };
  }
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Helper functions for common test operations
global.testHelpers = {
  /**
   * Create a mock Faker instance
   */
  createMockFaker: (overrides = {}) => ({
    locale: 'en',
    name: {
      findName: () => 'John Doe',
      firstName: () => 'John',
      lastName: () => 'Doe',
      ...overrides.name
    },
    address: {
      stateAbbr: () => 'CA',
      city: () => 'Los Angeles',
      secondaryAddress: () => 'Apt 123',
      streetAddress: () => '123 Main St',
      zipCode: () => '90001',
      ...overrides.address
    },
    phone: {
      phoneNumber: () => '555-1234',
      ...overrides.phone
    },
    internet: {
      email: () => 'test@example.com',
      ...overrides.internet
    }
  }),

  /**
   * Create a mock DOM element
   */
  createMockElement: (tagName, attributes = {}) => ({
    tagName: tagName.toUpperCase(),
    value: '',
    textContent: '',
    dispatchEvent: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    ...attributes
  }),

  /**
   * Create a mock input field
   */
  createMockInput: (name, value = '') => ({
    tagName: 'INPUT',
    name,
    value,
    dispatchEvent: jest.fn(),
    _valueTracker: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }),

  /**
   * Create a mock select field with options
   */
  createMockSelect: (name, options = []) => {
    const mockOptions = options.map(opt => ({
      value: opt.value || opt,
      textContent: opt.label || opt,
      selected: false
    }));

    return {
      tagName: 'SELECT',
      name,
      value: '',
      options: mockOptions,
      querySelector: jest.fn((selector) => {
        const valueMatch = selector.match(/option\[value="([^"]+)"\]/);
        if (valueMatch) {
          return mockOptions.find(opt => opt.value === valueMatch[1]);
        }
        return null;
      }),
      querySelectorAll: jest.fn(() => mockOptions),
      dispatchEvent: jest.fn()
    };
  },

  /**
   * Mock fetch response
   */
  mockFetchResponse: (data, ok = true) => {
    global.fetch.mockResolvedValueOnce({
      ok,
      status: ok ? 200 : 500,
      json: async () => data,
      text: async () => JSON.stringify(data)
    });
  },

  /**
   * Mock fetch error
   */
  mockFetchError: (error = 'Network error') => {
    global.fetch.mockRejectedValueOnce(new Error(error));
  },

  /**
   * Mock chrome.storage.local.get
   */
  mockChromeStorageGet: (data) => {
    global.chrome.storage.local.get.mockImplementation((keys, callback) => {
      if (callback) {
        callback(data);
      }
      return Promise.resolve(data);
    });
  },

  /**
   * Mock chrome.storage.local.set
   */
  mockChromeStorageSet: (success = true) => {
    global.chrome.storage.local.set.mockImplementation((data, callback) => {
      if (callback) {
        callback();
      }
      return success ? Promise.resolve() : Promise.reject(new Error('Storage error'));
    });
  },

  /**
   * Wait for async operations
   */
  wait: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Suppress console output for a test
   */
  suppressConsole: () => {
    const spies = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {})
    };

    return () => {
      Object.values(spies).forEach(spy => spy.mockRestore());
    };
  }
};

