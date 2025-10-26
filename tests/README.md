# Test Suite

This directory contains the test suite for the Card Helper extension.

## Running Tests

```bash
# Install dependencies first
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── core/              # Tests for core functionality
│   └── card-generator.test.js
└── utils/             # Tests for utility modules
    ├── luhn.test.js
    ├── markov.test.js
    └── storage.test.js
```

## Test Coverage

The test suite covers:
- ✅ **Luhn Algorithm** - Validation and check digit calculation
- ✅ **Markov Chain** - Digit generation with probability distributions
- ✅ **Card Generator** - Complete card generation workflow
- ✅ **Storage Manager** - Chrome storage operations

## Coverage Goals

- Branches: 70%+
- Functions: 80%+
- Lines: 80%+
- Statements: 80%+

## Writing Tests

When adding new features, please include tests:

1. Create test file in appropriate directory
2. Follow naming convention: `*.test.js`
3. Use descriptive test names
4. Include edge cases and error scenarios
5. Mock external dependencies (Chrome APIs, fetch, etc.)

## Mocking

Chrome extension APIs are mocked in test files:
- `chrome.storage.*` - Mocked in storage.test.js
- `chrome.runtime.*` - Mock as needed
- External JSON files - Use jest.mock()

