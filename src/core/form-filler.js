/**
 * Form Filler
 * Handles filling payment forms with generated data
 */

import { RESTRICTED_URL_PREFIXES } from '../utils/constants.js';

export class FormFiller {
  /**
   * Field selectors for card payment forms
   */
  static CARD_FIELD_SELECTORS = {
    cardNumber: ['input[name=cardNumber]'],
    expiryDate: ['input[name="cardExpiry"]'],
    cvc: ['input[name="cardCvc"]'],
    fullName: ['input[name="billingName"]'],
    country: ['select[name="billingCountry"]'],
    province: ['select[name="billingAdministrativeArea"]'],
    city: ['input[name="billingLocality"]'],
    address: ['input[name="billingAddressLine1"]'],
    addressLine2: ['input[name="billingAddressLine2"]'],
    postalCode: ['input[name="billingPostalCode"]']
  };

  /**
   * Field selectors for bank account forms
   */
  static BANK_FIELD_SELECTORS = {
    accountHolderName: ['input[name="billingName"]'],
    country: ['select[name="billingCountry"]'],
    province: ['select[name="billingAdministrativeArea"]'],
    city: ['input[name="billingLocality"]'],
    address: ['input[name="billingAddressLine1"]'],
    addressLine2: ['input[name="billingAddressLine2"]'],
    postalCode: ['input[name="billingPostalCode"]']
  };

  /**
   * Bank account modal selectors
   */
  static BANK_ACCOUNT_MODAL_SELECTORS = {
    routing: [
      'input[id="manualEntry_routingNumber"]',
      'input[data-testid=manualEntry-routingNumber-input]'
    ],
    account: [
      'input[id="manualEntry_accountNumber"]',
      'input[data-testid=manualEntry-accountNumber-input]'
    ],
    confirm: [
      'input[id="manualEntry_confirmAccountNumber"]',
      'input[data-testid=manualEntry-confirmAccountNumber-input]'
    ]
  };

  /**
   * Fill a form field with value
   * @param {string[]} selectors - Array of possible selectors
   * @param {string} value - Value to fill
   * @returns {boolean} True if successfully filled
   */
  static fillField(selectors, value) {
    if (!value) {
      return false;
    }

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);

      for (const element of elements) {
        if (!element) {
          continue;
        }

        if (element.tagName.toLowerCase() === 'select') {
          return this.fillSelectField(element, value, selector);
        } else {
          return this.fillInputField(element, value, selector);
        }
      }
    }

    return false;
  }

  /**
   * Fill a select dropdown field
   * @private
   */
  static fillSelectField(element, value, selector) {
    // Try exact value match
    const option = element.querySelector(`option[value="${value}"]`);
    if (option) {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Set select: ${selector} = ${value}`);
      return true;
    }

    // Try fuzzy matching
    const options = element.querySelectorAll('option');
    for (const opt of options) {
      const optText = opt.textContent.toLowerCase();
      const optValue = opt.value.toLowerCase();

      // Special handling for US
      if (value === 'US') {
        if (optValue === 'us' || optValue === 'usa' || optValue === 'united states' ||
            optText.includes('united states') || optText.includes('america') ||
            optText.includes('美国') || optValue === 'united_states') {
          element.value = opt.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`✅ Set select (US match): ${selector} = ${opt.value}`);
          return true;
        }
      }

      // General fuzzy match
      if (optText.includes(value.toLowerCase()) || optValue.includes(value.toLowerCase())) {
        element.value = opt.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`✅ Set select (fuzzy match): ${selector} = ${opt.value}`);
        return true;
      }
    }

    console.log(`❌ No matching option: ${selector}, looking for: ${value}`);
    return false;
  }

  /**
   * Fill an input field
   * @private
   */
  static fillInputField(element, value, selector) {
    element.value = value;

    // Trigger all necessary events
    const events = ['input', 'change', 'blur', 'keyup'];
    events.forEach(eventType => {
      element.dispatchEvent(new Event(eventType, { bubbles: true }));
    });

    // Handle React's internal value tracking
    if (element._valueTracker) {
      element._valueTracker.setValue('');
    }

    console.log(`✅ Set input: ${selector} = ${value}`);
    return true;
  }

  /**
   * Get field name in Chinese
   * @param {string} fieldKey - Field key
   * @returns {string} Chinese name
   */
  static getFieldName(fieldKey) {
    const names = {
      cardNumber: '卡号',
      expiryDate: '有效期',
      cvc: 'CVC',
      fullName: '持卡人',
      accountHolderName: '账户持有人',
      country: '国家',
      province: '州/省',
      city: '城市',
      postalCode: '邮编',
      address: '地址第一行',
      addressLine2: '地址第二行',
      routingNumber: '路由号码',
      accountNumber: '账户号码'
    };

    return names[fieldKey] || fieldKey;
  }

  /**
   * Check if URL is restricted
   * @param {string} url - URL to check
   * @returns {boolean} True if restricted
   */
  static isRestrictedUrl(url) {
    if (!url) {
      return true;
    }

    return RESTRICTED_URL_PREFIXES.some(prefix => url.startsWith(prefix));
  }
}

