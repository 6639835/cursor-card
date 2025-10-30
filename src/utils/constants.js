/**
 * Application Constants
 * Centralized configuration for magic numbers and common values
 */

export const DELAYS = {
  PAGE_READY: 300,
  PAYMENT_METHOD_SWITCH: 1000,
  FIELD_FILL: 100,
  BETWEEN_FIELDS: 100,
  AUTO_TRY_INTERVAL: 8000, // Increased from 3000 to 8000 for Stripe validation
  NOTIFICATION_DISPLAY: 3000,
  SUBMIT_TIMEOUT: 8000,
  SUBMIT_RETRY_INTERVAL: 500
};

export const RETRY_LIMITS = {
  PAYMENT_METHOD_BUTTON: 60,
  MAX_SUBMIT_ATTEMPTS: 16
};

export const CARD_LENGTHS = {
  VISA: 16,
  MASTERCARD: 16,
  AMEX: 15,
  DISCOVER: 16,
  DINERS: 14,
  JCB: 16,
  UNIONPAY: 16,
  DEFAULT: 16
};

export const CVV_LENGTHS = {
  AMEX: 4,
  DEFAULT: 3
};

export const ACCOUNT_NUMBER_RANGE = {
  MIN_LENGTH: 9,
  MAX_LENGTH: 12
};

export const ROUTING_NUMBER_LENGTH = 9;

export const BIN_VALIDATION = {
  MIN_LENGTH: 4,
  MAX_LENGTH: 10
};

export const BATCH_GENERATION = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 500,
  DEFAULT_QUANTITY: 10
};

export const EXPIRY_YEAR_OFFSETS = [
  { years: 2, weight: 0.15 },
  { years: 3, weight: 0.40 },
  { years: 4, weight: 0.25 },
  { years: 5, weight: 0.15 },
  { years: 6, weight: 0.05 }
];

export const COMMON_EXPIRY_MONTHS = [3, 5, 6, 9, 11, 12];
export const COMMON_MONTH_PROBABILITY = 0.80;

export const WEAK_CVV_BLACKLIST = [
  '000', '111', '222', '333', '444',
  '555', '666', '777', '888', '999'
];

export const US_ROUTING_NUMBERS = [
  '121000358', // Bank of America
  '026009593', // Bank of America
  '021000021', // JPMorgan Chase
  '322271627', // Chase
  '021000089', // Chase
  '322271779', // Chase
  '091000019', // Wells Fargo
  '121000248', // Wells Fargo
  '062000019', // Citibank
  '043000096', // PNC Bank
  '071000013', // Truist Bank
  '122235821', // US Bank
  '053101121', // TD Bank
  '061000104', // HSBC Bank
  '111000025', // Federal Reserve Bank
  '122000247', // Union Bank
  '021200025', // State Street Bank
  '031201360', // M&T Bank
  '071923284', // Regions Bank
  '075000022'  // BMO Harris Bank
];

export const RESTRICTED_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'edge://',
  'about:',
  'moz-extension://',
  'safari-extension://',
  'data:',
  'javascript:',
  'file://'
];

export const ZIP_CODE_RANGES = {
  OR: { min: 97001, max: 97920 },
  CA: { min: 90001, max: 96162 },
  NY: { min: 10001, max: 14975 },
  TX: { min: 73301, max: 88595 },
  FL: { min: 32004, max: 34997 },
  WA: { min: 98001, max: 99403 },
  IL: { min: 60001, max: 62999 },
  MA: { min: 1001, max: 2791 }
};

export const DEFAULT_ZIP_RANGE = { min: 10000, max: 99999 };

export const STREET_NAMES = [
  'Main', 'Oak', 'Maple', 'Cedar', 'Elm', 'Washington',
  'Lake', 'Hill', 'Park', 'River', 'Pine', 'Sunset',
  'Broadway', 'Madison', 'Jefferson', 'Lincoln', 'Jackson',
  'Market', 'Church', 'Spring', 'Center', 'Mill', 'Water'
];

export const STREET_TYPES = [
  { name: 'St', weight: 0.25 },
  { name: 'Ave', weight: 0.20 },
  { name: 'Rd', weight: 0.15 },
  { name: 'Dr', weight: 0.12 },
  { name: 'Ln', weight: 0.10 },
  { name: 'Blvd', weight: 0.08 },
  { name: 'Way', weight: 0.05 },
  { name: 'Ct', weight: 0.03 },
  { name: 'Pl', weight: 0.02 }
];

export const STREET_DIRECTIONS = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'];

export const ADDRESS_GENERATION = {
  MAX_STREET_NUMBER: 9999,
  MAX_STREET_NUMBER_LARGE: 90000,
  LARGE_NUMBER_MIN: 10000,
  DIRECTION_PROBABILITY: 0.5,
  LARGE_NUMBER_PROBABILITY: 0.1
};

