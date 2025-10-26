# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-22

### Added
- Initial release of Card Helper extension
- Smart card generation with Luhn algorithm
- Markov chain optimization for realistic digit distribution
- BIN database with comprehensive card issuer information
- Real US address database
- Auto-fill form functionality for payment pages
- Batch card generation (up to 500 cards)
- Auto-try feature with multiple BIN prefixes
- Cursor.com checkout integration
- Settings persistence using Chrome storage
- Modern gradient UI design
- Comprehensive test suite with Jest
- ESLint configuration for code quality
- Constants module for centralized configuration
- Content Security Policy for enhanced security
- Restricted host permissions for better security

### Security
- Removed insecure license/activation system
- Added Content Security Policy to manifest
- Restricted host permissions to specific domains only
- Centralized constants to eliminate magic numbers
- Proper input validation throughout codebase

### Testing
- Unit tests for Luhn algorithm
- Unit tests for Markov chain generator
- Unit tests for card generator
- Unit tests for storage manager
- Test coverage targets: 80%+ for functions, lines, and statements

### Documentation
- Comprehensive README with usage guide
- API reference documentation
- Test suite documentation
- Changelog for version tracking
- MIT License file with disclaimer
- JSDoc comments throughout codebase

## [Unreleased]

### Planned
- Replace jQuery with vanilla JavaScript
- Add CI/CD pipeline with GitHub Actions
- Cross-browser compatibility testing
- Performance optimizations
- Update mechanism for auto-updates
- Additional test coverage for UI components

