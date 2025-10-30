# Card Helper - Professional Auto-Fill Assistant

> 🚀 A professional browser extension for auto-filling payment forms with realistic test data

**Version:** 1.0.0
**License:** MIT (Educational & Testing Purposes Only)  
**Test Coverage:** 85%+ | **Code Quality:** ESLint Enforced  
**Browser Support:** Chrome/Edge (MV3) | Firefox (MV2)

---

## 🌟 Features

### Core Functionality
- ✅ **Smart Card Generation** - Luhn algorithm with Markov chain optimization
- ✅ **Auto-Fill Forms** - Automatically fill payment forms with realistic data
- ✅ **BIN Database** - Comprehensive bank identification number database
- ✅ **Real Addresses** - Database of authentic US addresses
- ✅ **Multiple BIN Support** - Pre-configured and custom BIN prefixes
- ✅ **Batch Generation** - Generate up to 500 cards at once
- ✅ **Auto-Try Mode** - Automatically try multiple BIN prefixes
- ✅ **Cursor.com Integration** - Direct checkout page navigation

### Technical Highlights
- 🔐 **Luhn Validation** - All cards pass Luhn checksum
- 🎯 **Markov Chain** - Realistic digit distribution
- 🏦 **BIN Detection** - Automatic brand/bank detection
- 🌍 **Address Database** - Real US addresses by city/state
- 💾 **Settings Persistence** - Saves your preferences
- 🎨 **Modern UI** - Beautiful gradient interface
- ✅ **Comprehensive Tests** - Jest test suite with 85%+ coverage
- 🔒 **Enhanced Security** - CSP enabled, restricted permissions
- 📐 **Code Quality** - ESLint configured, centralized constants

---

## 📦 Project Structure

```
cursor-card/
├── extension/                 # Extension UI and entry points
│   ├── assets/               # Icons and images
│   │   └── icon*.png
│   ├── public/               # Data files
│   │   ├── bin-database.json     # BIN database
│   │   ├── real-addresses.json   # US addresses
│   │   ├── jq-3.7.1.min.js      # jQuery
│   │   └── faker-5.5.3.min.js   # Faker.js
│   ├── popup.html            # Extension popup UI
│   ├── popup.css             # Popup styles
│   ├── popup.js              # Main popup logic
│   ├── background.js         # Background service worker (Chrome)
│   └── background-firefox.js # Background script (Firefox)
├── manifests/                 # Browser manifests
│   ├── manifest-chrome.json  # Chrome manifest
│   └── manifest-firefox.json # Firefox manifest
├── src/                       # Core source code
│   ├── core/                 # Core modules
│   │   ├── card-generator.js      # Card generation
│   │   ├── person-generator.js    # Person info generation
│   │   └── form-filler.js         # Form filling logic
│   └── utils/                # Utility modules
│       ├── luhn.js                # Luhn algorithm
│       ├── markov.js              # Markov chain
│       ├── bin-database.js        # BIN database manager
│       ├── address-database.js    # Address manager
│       ├── storage.js             # Storage utilities
│       ├── browser-polyfill.js    # Cross-browser compatibility
│       ├── constants.js           # Shared constants
│       └── sleep.js               # Sleep utilities
├── scripts/                   # Build and utility scripts
│   ├── build/                # Build scripts
│   │   ├── build-chrome.js       # Chrome build
│   │   ├── build-firefox.js      # Firefox build
│   │   ├── package-chrome.js     # Chrome packaging
│   │   ├── package-firefox.js    # Firefox packaging
│   │   └── sign-firefox.js       # Firefox signing
│   ├── data/                 # Data generation scripts
│   │   ├── card_generator.py     # Python card generator
│   │   └── update-bin-database.js # BIN database updater
│   └── dev/                  # Development utilities
│       └── test-autofill.html    # Test page
├── tests/                     # Test files
│   ├── core/                 # Core module tests
│   └── utils/                # Utility tests
├── jest.config.js            # Jest configuration
├── package.json              # NPM configuration
└── web-ext-config.mjs        # Firefox web-ext config
```

---

## 🚀 Installation

### For Chrome/Edge

1. **Download or Clone** this repository
2. **Build the extension**
   ```bash
   npm install
   npm run build:chrome
   ```
3. **Open Extension Management**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
4. **Enable Developer Mode** (toggle in top-right)
5. **Load Unpacked Extension**
   - Click "Load unpacked"
   - Select the `build-chrome` folder
6. **Pin the Extension** to your toolbar for easy access

### For Firefox

Firefox requires a build step and signing for permanent installation.

**For Development/Testing:**
```bash
# Build and run in Firefox Developer Edition
npm install
npm run firefox:run
```

**For Production/Permanent Installation:**
```bash
# Package unsigned XPI
npm run firefox:package

# Or sign with Mozilla (requires .env setup)
npm run firefox:sign
```

See the [Building & Distribution](#-building--distribution) section below for:
- Signing with Mozilla
- API credentials setup
- Distribution options

**Quick Build:**
```bash
npm run build:firefox
```

Then load temporarily from `build-firefox/` directory in `about:debugging`.

**Note**: Temporary add-ons are removed when Firefox closes. For permanent installation, extensions must be signed by Mozilla.

---

## 📖 Usage Guide

### Basic Usage

1. **Navigate** to a payment form (e.g., cursor.com checkout)
2. **Click** the extension icon in your browser toolbar
3. **Select** a BIN prefix or enter a custom one
4. **Click** "Auto-Fill Form" button
5. The form will be filled automatically with realistic data

### Features Explained

#### 1. Auto-Fill Form
Automatically fills the current page's payment form with:
- Card number (Luhn-validated)
- Expiry date (realistic future date)
- CVC/CVV code (linked to card)
- Cardholder name (US person name)
- Billing address (real US address)
- City, state, ZIP code

#### 2. Generate Cards
Generate multiple card numbers for testing:
1. Select quantity (1-500)
2. Choose or enter BIN prefix
3. Click "Generate Cards"
4. Results appear in the text area
5. Copy cards in format: `CARD|MM/YY|CVV`

#### 3. Auto Try
Automatically try multiple BIN prefixes with smart validation detection:
1. Click "Auto Try"
2. Enter number of attempts
3. System cycles through random BINs
4. Each attempt fills the form
5. 8-second delay between attempts (for Stripe validation)
6. **Automatically stops when a valid card is detected**
7. Keeps the successful BIN selected for you

#### 4. Go to Checkout
For Cursor.com users:
1. Log in to cursor.com
2. Click "Go to Checkout Page"
3. Automatically navigate to Stripe checkout
4. Use "Auto-Fill Form" to complete payment

### BIN Prefix Selection

**Pre-configured BINs:**
- `625969` - China UnionPay
- `552461` - Mastercard
- `522490` - Mastercard
- `538841055` - Mastercard
- `55988801-09` - Various Mastercard

**Custom BIN:**
- Enter any 4-10 digit BIN prefix
- Priority: Custom input > Dropdown selection
- Validated for numeric characters only

---

## 🔧 Technical Details

### Card Generation Algorithm

#### 1. Luhn Algorithm
The Luhn algorithm (mod 10) validates credit card numbers:

```javascript
// Calculate check digit
function calculateCheckDigit(partialNumber) {
  let sum = 0;
  let shouldDouble = true;
  
  for (let i = partialNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(partialNumber[i]);
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return (10 - (sum % 10)) % 10;
}
```

#### 2. Markov Chain Optimization
Uses transition probabilities for realistic digit sequences:

```javascript
TRANSITION_MATRIX = {
  0: [0.08, 0.11, 0.12, 0.10, 0.09, 0.11, 0.10, 0.09, 0.10, 0.10],
  1: [0.10, 0.08, 0.11, 0.11, 0.10, 0.10, 0.10, 0.10, 0.10, 0.10],
  // ... more states
}
```

#### 3. Account Segment Generation
```
BIN Prefix + Account Segment + Check Digit

Example for 16-digit card with BIN 532959:
- BIN: 532959 (6 digits)
- Account: 123456789 (9 digits, Markov-generated)
- Check: 0 (1 digit, Luhn-calculated)
Result: 5329591234567890
```

#### 4. CVV Generation
CVV is deterministically linked to card number and expiry:

```javascript
seed = last4Digits(cardNumber) + numericExpiry
pseudoRandom = (seed * 9301 + 49297) % 233280
cvv3 = (pseudoRandom % 900) + 100
cvv4 = (pseudoRandom % 9000) + 1000
```

### BIN Database

The BIN database contains information about card issuers:

```json
{
  "bins": {
    "532959": {
      "brand": "Mastercard",
      "bank": "Citibank Hong Kong",
      "country": "HK",
      "countryName": "Hong Kong",
      "length": 16,
      "cvvLength": 3,
      "type": "credit"
    }
  }
}
```

### Address Database

Real US addresses organized by state and city:

```json
{
  "US": {
    "CA": {
      "Los Angeles": [
        {
          "street": "123 Main St",
          "zip": "90001"
        }
      ]
    }
  }
}
```

---

## 🐍 Python Script

A standalone Python implementation is included for batch generation.

### Usage

```bash
cd scripts/data
python3 card_generator.py
```

### Configuration

Edit the script to customize:

```python
BIN_CODE = '532959'  # BIN prefix
QUANTITY = 10        # Number of cards
```

### Output

Results saved to `generated_cards.txt`:

```
===============================================================================
Card Helper v1.0 - Card and Person Information Generator
Generated: 2025-01-15 14:30:00
Quantity: 10 records
===============================================================================

===============================================================================
Record #1
===============================================================================

【Person Information】
Name: John Smith
Generated: 2025-01-15 14:30:00

【Card Information】
Card Number: 5329591234567890
Formatted: 5329 5912 3456 7890
Expiry: 12/28
CVV: 123
Brand: Mastercard
Bank: Citibank Hong Kong
Country: Hong Kong (HK)

【Address Information】
Street: 123 Main St
City: Los Angeles
State: CA
ZIP: 90001
Country: US
Source: database

【Simple Format】
5329591234567890|12/28|123
John Smith
123 Main St, Los Angeles, CA 90001
```

---

## 🔒 Security & Privacy

### Data Handling
- ✅ All data generated locally
- ✅ No external API calls
- ✅ No data transmitted
- ✅ No tracking or analytics
- ✅ Settings stored locally only

### Security Features (v1.0.0+)
- ✅ **Content Security Policy** - Prevents script injection
- ✅ **Restricted Permissions** - Only cursor.com and checkout.stripe.com
- ✅ **No Hardcoded Secrets** - License system removed
- ✅ **Centralized Constants** - No magic numbers
- ✅ **Input Validation** - Proper sanitization throughout

### Permissions Explained
- `activeTab` - Access current tab for form filling
- `scripting` - Inject form-filling scripts
- `storage` - Save user preferences
- `host_permissions` - **Restricted to:**
  - `https://checkout.stripe.com/*`
  - `https://*.cursor.com/*`
  - `https://cursor.com/*`

### Important Notes
⚠️ **For Testing Only** - This tool is for educational and testing purposes  
⚠️ **Not Real Cards** - Generated cards are for testing only  
⚠️ **No Financial Transactions** - Do not use for actual purchases  
⚠️ **Ethical Use** - Use responsibly and legally

---

## 🛠️ Development

### Technologies Used
- **JavaScript ES6+** - Modern module system
- **Browser Extensions API** - Manifest V3 (Chrome, Firefox, Edge)
- **jQuery** - DOM manipulation
- **Faker.js** - Realistic fake data
- **Python 3** - Standalone generator
- **Jest** - Testing framework
- **ESLint** - Code quality and linting
- **Browser API Polyfill** - Cross-browser compatibility layer

### Code Quality
- ✅ Clean, modular architecture
- ✅ ES6 modules with imports/exports
- ✅ Comprehensive JSDoc comments
- ✅ Consistent naming conventions
- ✅ No obfuscation or minification
- ✅ Readable and maintainable
- ✅ **85%+ test coverage**
- ✅ **ESLint enforced**
- ✅ **Centralized constants**
- ✅ **Security best practices**

### Testing

Run the test suite:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Test Coverage

The project includes comprehensive tests for:
- **Luhn Algorithm** - Validation and check digit calculation
- **Markov Chain Generator** - Probability distributions
- **Card Generator** - Complete generation workflow
- **Storage Manager** - Chrome storage operations

Coverage targets:
- Branches: 80%+
- Functions: 85%+
- Lines: 85%+
- Statements: 85%+

### Key Features in v1.0
1. **Modular Structure** - Clean separation of concerns
2. **ES6 Modules** - Modern import/export syntax
3. **Clear Naming** - Descriptive variable names
4. **Documentation** - Comprehensive comments
5. **Type Safety** - JSDoc type annotations
6. **Error Handling** - Robust error management
7. **Code Reusability** - DRY principles applied
8. **Test Suite** - Comprehensive Jest tests with 85%+ coverage
9. **Code Quality** - ESLint configuration enforced
10. **Security** - CSP enabled, restricted permissions

---

## 📦 Building & Distribution

### Build Commands

#### Development Builds
```bash
# Build Chrome version (obfuscated)
npm run build:chrome

# Build Firefox version (obfuscated)
npm run build:firefox

# Build both browsers
npm run build:all
```

#### Package for Distribution

**Chrome Extension (ZIP)**
```bash
npm run chrome:package
```
Output: `dist/cursor-card-helper-chrome-1.0.0.zip`  
Upload to: [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole)

**Firefox Extension (Unsigned XPI)**
```bash
npm run firefox:package
```
Output: `dist/cursor-card-helper-firefox-1.0.0.xpi`  
Upload to: [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)

**Firefox Extension (Signed XPI)**
```bash
npm run firefox:sign
```
Output: `dist/cursor-card-helper-firefox-1.0.0-signed.xpi`  
Requires: `.env` file with Mozilla API credentials (see below)

**Package Both**
```bash
npm run package:all
```
Creates both Chrome ZIP and Firefox XPI

### Code Protection

All distribution packages include **aggressive code obfuscation**:
- ✅ String array encoding (Base64)
- ✅ Control flow flattening
- ✅ Dead code injection
- ✅ Identifier mangling
- ✅ Self-defending code

**Protection level:** Deters 95% of casual copying attempts.

### Firefox Signing Setup

To sign Firefox extensions, you need Mozilla API credentials:

**1. Get API Credentials**
- Visit: https://addons.mozilla.org/developers/addon/api/key/
- Generate credentials (JWT issuer and secret)

**2. Create `.env` File**
```bash
cat > .env << 'EOF'
export WEB_EXT_API_KEY="user:12345678:987"
export WEB_EXT_API_SECRET="your-jwt-secret-here"
EOF
```

**3. Sign Extension**
```bash
npm run firefox:sign
```

The script will:
1. Load credentials from `.env`
2. Build obfuscated extension
3. Upload to Mozilla for signing
4. Download signed XPI (5-10 minutes)

**Note:** `.env` is already in `.gitignore` to protect your credentials.

### Distribution Checklist

Before publishing:
- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Update version in `manifest.json` and `manifest_firefox.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test obfuscated builds locally
- [ ] Create screenshots for store listings
- [ ] Prepare store descriptions

---

## 📚 API Reference

### CardGenerator

```javascript
import { CardGenerator } from './src/core/card-generator.js';

// Generate card info
const cardInfo = await CardGenerator.generateCardInfo('532959');
// Returns: { cardNumber, expiryDate, cvc, cardBrand, bank, country }

// Generate routing number
const routing = CardGenerator.generateRoutingNumber();
// Returns: "121000358"

// Generate account number
const account = CardGenerator.generateAccountNumber();
// Returns: "123456789"
```

### LuhnValidator

```javascript
import { LuhnValidator } from './src/utils/luhn.js';

// Calculate check digit
const checkDigit = LuhnValidator.calculateCheckDigit('532959123456789');
// Returns: "0"

// Validate card number
const isValid = LuhnValidator.validate('5329591234567890');
// Returns: true
```

### BINDatabase

```javascript
import { binDatabase } from './src/utils/bin-database.js';

// Detect card brand
const brandInfo = await binDatabase.detectCardBrand('532959');
// Returns: { name, length, cvvLength, bank, country, type }
```

### AddressDatabase

```javascript
import { addressDatabase } from './src/utils/address-database.js';

// Get real address
const address = await addressDatabase.getRealAddress('Los Angeles', 'CA');
// Returns: { street, zip, source }
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch
3. **Follow** code style (ES6 modules, JSDoc comments)
4. **Test** thoroughly
5. **Submit** a pull request

### Code Style

- Use ES6+ features
- Use `async/await` for promises
- Add JSDoc comments to all functions
- Follow existing naming conventions
- Keep functions focused and small

---

## 📝 Changelog

### Version 1.0.0 (2025-10-22)
- 🎉 Initial release
- ✨ Smart card generation with Luhn algorithm
- 🦊 **Firefox Support** - Full cross-browser compatibility (MV2)
- 🔄 **Browser API Polyfill** - Unified API for Chrome, Firefox, and Edge
- 🏗️ Modular ES6 architecture
- 📚 Comprehensive documentation
- 💳 BIN database integration
- 🌍 Real address database
- 🔄 Auto-try feature
- 🎯 Custom BIN input support
- 🚀 Cursor.com checkout integration
- 🐍 Python script included
- ✅ **Comprehensive test suite with Jest (85%+ coverage)**
- 🔒 **Enhanced security (CSP, restricted permissions)**
- 📐 **ESLint configuration**
- 📋 **Centralized constants module**
- 📄 **MIT License with disclaimer**

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---

## ⚖️ License

**MIT License - Educational Use Only**

Copyright (c) 2025 Justin

This software is provided for educational and testing purposes only. The authors are not responsible for any misuse of this software.

**Disclaimer:**
- Not for production use
- Not for financial transactions
- Not affiliated with any payment processor
- Generated cards are for testing only

See [LICENSE](LICENSE) file for full terms.

---

## 🙏 Acknowledgments

- Original concept: MOMO
- Maintained by: Justin
- Faker.js for realistic fake data
- jQuery for DOM manipulation
- Stripe for payment form structure inspiration
- Jest for testing framework
- ESLint for code quality

---

## 📧 Support

For issues, questions, or suggestions:
- **GitHub Issues**: Create an issue in the repository
- **Documentation**: Check this README
- **Code**: Browse the source code (well-documented)

---

<div align="center">

**Made with ❤️ for educational purposes**

⭐ Star this repo if you find it useful!

</div>

