export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/license-manager.js',
    '!src/**/browser-polyfill.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/public/'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/utils/luhn.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/utils/markov.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/core/card-generator.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  globals: {
    jest: true
  }
};

