/**
 * Popup Script - Main UI Controller
 * Handles user interactions in the extension popup
 * Cross-browser compatible (Chrome, Firefox, Edge)
 */

import { CardGenerator } from './src/core/card-generator.js';
import { PersonGenerator } from './src/core/person-generator.js';
import { addressDatabase } from './src/utils/address-database.js';
import { StorageManager } from './src/utils/storage.js';
import { DELAYS, RESTRICTED_URL_PREFIXES } from './src/utils/constants.js';
import { browserAPI, executeScript } from './src/utils/browser-polyfill.js';

class AutoFillManager {
  constructor() {
    this.init();
  }

  async init() {
    // Load BIN options from database
    await this.loadBinOptions();

    // Bind event handlers
    $('#fillForm').click(() => this.fillForm());
    $('#autoTryBtn').click(() => this.startAutoTry());
    $('#generateCards').click(() => this.generateCards());
    $('#getCheckoutUrlBtn').click(() => this.getCheckoutUrl());

    // Load saved settings
    await this.loadSavedSettings();

    // Bind setting change handlers
    $('#binSelect').change((event) => this.saveBinSelection(event.target.value));
    $('#customBinInput').on('input', (event) => this.validateAndSaveCustomBin(event.target.value));
    $('#quantitySelect').change((event) => this.saveQuantitySelection(event.target.value));
  }

  // ========== Load BIN Options ==========

  async loadBinOptions() {
    try {
      const response = await fetch(browserAPI.runtime.getURL('public/bin-database.json'));
      const data = await response.json();

      if (!data || !data.bins) {
        console.error('Invalid BIN database format');
        this.loadFallbackBins();
        return;
      }

      // Get all 6-digit BINs (most specific), sort them
      const bins = Object.keys(data.bins)
        .filter(bin => bin.length >= 6) // Only 6+ digit BINs for dropdown
        .sort();

      if (bins.length === 0) {
        console.error('No BINs found in database');
        this.loadFallbackBins();
        return;
      }

      // Clear existing options
      const $select = $('#binSelect');
      $select.empty();

      // Populate dropdown with BINs from database
      bins.forEach(bin => {
        const binInfo = data.bins[bin];
        const label = `${bin} - ${binInfo.brand} (${binInfo.country})`;
        $select.append(`<option value="${bin}">${label}</option>`);
      });

      // Ensure first option is selected
      $select.val(bins[0]);

      console.log(`✅ Loaded ${bins.length} BIN options from database`);
    } catch (error) {
      console.error('Failed to load BIN options:', error);
      this.loadFallbackBins();
    }
  }

  // Fallback BINs in case database fails to load
  loadFallbackBins() {
    console.warn('Loading fallback BINs...');
    const $select = $('#binSelect');
    $select.empty();

    const fallbackBins = [
      { value: '532959', label: '532959 - Mastercard (HK)' },
      { value: '552461', label: '552461 - Mastercard (US)' },
      { value: '451710', label: '451710 - Visa (DK)' },
      { value: '443047', label: '443047 - Visa (US)' },
      { value: '324000', label: '324000 - American Express (US)' }
    ];

    fallbackBins.forEach(bin => {
      $select.append(`<option value="${bin.value}">${bin.label}</option>`);
    });

    $select.val(fallbackBins[0].value);
    console.log('✅ Loaded fallback BINs');
  }

  // ========== Cursor Checkout ==========

  async getCheckoutUrl() {
    try {
      console.log('Getting checkout URL...');
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        alert('Unable to get current tab information');
        return;
      }

      // Check if on cursor.com domain
      if (!tab.url.includes('cursor.com')) {
        const shouldProceed = confirm(
          'You are not on cursor.com domain.\n\n' +
          'This function works best on cursor.com/dashboard.\n\n' +
          'Do you want to open cursor.com/dashboard first?'
        );

        if (shouldProceed) {
          browserAPI.tabs.create({ url: 'https://cursor.com/dashboard' });
        }
        return;
      }

      // Execute script to get checkout URL
      const results = await executeScript(tab.id, {
        func: async function() {
          try {
            const checkoutHeaders = {
              'Accept': '*/*',
              'Accept-Encoding': 'gzip, deflate, br, zstd',
              'Accept-Language': 'zh-CN,zh;q=0.9',
              'Content-Type': 'application/json',
              'Origin': 'https://cursor.com',
              'Priority': 'u=1, i',
              'Referer': 'https://cursor.com/dashboard',
              'Sec-Ch-Ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
              'Sec-Ch-Ua-Mobile': '?0',
              'Sec-Ch-Ua-Platform': '"Windows"',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-origin',
              'User-Agent': navigator.userAgent
            };

            const checkoutData = {
              'allowAutomaticPayment': true,
              'allowTrial': true,
              'tier': 'pro'
            };

            console.log('Sending POST request to: https://cursor.com/api/checkout');

            const checkoutResponse = await fetch('https://cursor.com/api/checkout', {
              method: 'POST',
              headers: checkoutHeaders,
              body: JSON.stringify(checkoutData),
              credentials: 'include'
            });

            console.log('Response status:', checkoutResponse.status);

            if (checkoutResponse.status === 200) {
              const checkoutUrl = await checkoutResponse.text();
              console.log('Checkout URL:', checkoutUrl);

              if (checkoutUrl.includes('checkout.stripe.com')) {
                return { success: true, url: checkoutUrl };
              } else {
                return { success: false, url: null, error: 'Invalid URL format' };
              }
            } else {
              const errorText = await checkoutResponse.text();
              console.log('Error response:', errorText.substring(0, 200));
              return { success: false, url: null, error: `HTTP ${checkoutResponse.status}` };
            }
          } catch (error) {
            console.log('Checkout request exception:', error.message);
            return { success: false, url: null, error: error.message };
          }
        }
      });

      if (results && results[0] && results[0].result) {
        const result = results[0].result;

        if (result.success && result.url) {
          console.log('Successfully obtained checkout URL:', result.url);

          // Clean the URL
          let cleanUrl = result.url.trim();
          if (cleanUrl.startsWith('"')) {
            cleanUrl = cleanUrl.substring(1);
          }
          if (cleanUrl.endsWith('"')) {
            cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
          }

          console.log('Cleaned URL:', cleanUrl);

          // Open in new tab
          browserAPI.tabs.create({ url: cleanUrl });
          console.log('Opening checkout page...');
        } else {
          alert('Failed to get checkout URL.\n\nError: ' + (result.error || 'Unknown error') +
                '\n\nPlease check:\n1. You are logged in to cursor.com\n2. Your account has permission to access checkout\n3. Check browser console for details');
        }
      } else {
        alert('Failed to execute script. Please try again.');
      }

    } catch (error) {
      console.error('Get checkout URL failed:', error);
      alert('Operation failed: ' + error.message);
    }
  }

  // ========== Settings Management ==========

  async loadSavedSettings() {
    try {
      const settings = await StorageManager.loadMultiple([
        'selectedBin',
        'customBin',
        'selectedQuantity',
        'selectedPaymentMethod'
      ]);

      // Restore BIN selection
      if (settings.selectedBin) {
        $('#binSelect').val(settings.selectedBin);
        console.log('Restored BIN selection:', settings.selectedBin);
      } else {
        const firstOption = $('#binSelect option:first').val();
        $('#binSelect').val(firstOption);
        console.log('Using default BIN:', firstOption);
      }

      // Restore custom BIN
      if (settings.customBin) {
        $('#customBinInput').val(settings.customBin);
        console.log('Restored custom BIN:', settings.customBin);
      }

      // Restore quantity
      if (settings.selectedQuantity) {
        $('#quantitySelect').val(settings.selectedQuantity);
        console.log('Restored quantity:', settings.selectedQuantity);
      } else {
        $('#quantitySelect').val('10');
        console.log('Using default quantity: 10');
      }

      // Set payment method to card by default
      $('#paymentMethod').val('card');
      console.log('Using default payment method: card');

    } catch (error) {
      console.error('Failed to load settings:', error);
      $('#binSelect').val($('#binSelect option:first').val());
      $('#quantitySelect').val('10');
      $('#paymentMethod').val('card');
    }
  }

  async saveBinSelection(binValue) {
    await StorageManager.save('selectedBin', binValue);
    console.log('Saved BIN selection:', binValue);
  }

  async saveQuantitySelection(quantityValue) {
    await StorageManager.save('selectedQuantity', quantityValue);
    console.log('Saved quantity selection:', quantityValue);
  }

  async savePaymentMethodSelection(paymentMethodValue) {
    await StorageManager.save('selectedPaymentMethod', paymentMethodValue);
    console.log('Saved payment method:', paymentMethodValue);
  }

  // ========== BIN Validation ==========

  isValidCustomBin(value) {
    if (!value) {
      return true;
    } // Empty is valid (use dropdown)
    return /^\d{4,10}$/.test(value); // 4-10 digits
  }

  async validateAndSaveCustomBin(value) {
    // Filter non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    if (numericValue !== value) {
      $('#customBinInput').val(numericValue);
      value = numericValue;
    }

    // Save custom BIN
    await StorageManager.save('customBin', value);
    if (value) {
      console.log('Saved custom BIN:', value);
    }
  }

  getSelectedBin() {
    const customBin = $('#customBinInput').val().trim();

    // Priority: custom input > dropdown
    if (customBin && this.isValidCustomBin(customBin)) {
      console.log('Using custom BIN:', customBin);
      return customBin;
    }

    const selectedBin = $('#binSelect').val();

    // Check if BIN is empty or still loading
    if (!selectedBin || selectedBin === '') {
      console.error('No BIN selected. Please wait for BINs to load or enter a custom BIN.');
      alert('⚠️ No BIN selected\n\nPlease wait for BIN options to load, or enter a custom BIN.');
      throw new Error('No BIN selected');
    }

    console.log('Using dropdown BIN:', selectedBin);
    return selectedBin;
  }

  getSelectedQuantity() {
    const quantity = parseInt($('#quantitySelect').val()) || 10;
    console.log('Selected quantity:', quantity);
    return quantity;
  }

  // ========== Card Generation ==========

  async generateCards() {
    try {
      const selectedBin = this.getSelectedBin();
      const quantity = this.getSelectedQuantity();

      console.log(`Generating ${quantity} cards with BIN: ${selectedBin}`);

      const cardInfoList = [];
      const failedCards = [];
      const generatedNumbers = new Set();

      for (let i = 0; i < quantity; i++) {
        try {
          const cardInfo = await CardGenerator.generateCardInfo(selectedBin);
          const cardNumber = cardInfo.cardNumber.replace(/\s/g, '');

          // Check for duplicates
          if (generatedNumbers.has(cardNumber)) {
            console.warn(`Card ${i + 1} is duplicate, regenerating`);
            i--;
            continue;
          }

          generatedNumbers.add(cardNumber);
          cardInfoList.push(cardInfo);
        } catch (error) {
          console.error(`Failed to generate card ${i + 1}:`, error.message);
          failedCards.push(i + 1);
          continue;
        }
      }

      if (cardInfoList.length === 0) {
        $('#cardOutput').val('Generation failed: All cards failed, please check BIN settings');
        console.error('All cards failed to generate');
        return;
      }

      // Format output
      const timestamp = new Date().toLocaleString('zh-CN');
      const firstCard = cardInfoList[0];

      let outputText = '';
      outputText += `=== Generated: ${timestamp} ===\n`;
      outputText += `BIN Prefix: ${selectedBin}\n`;
      outputText += `Card Brand: ${firstCard.cardBrand}\n`;
      outputText += `Issuing Bank: ${firstCard.bank}\n`;
      outputText += `Country: ${firstCard.country}\n`;
      outputText += 'Algorithm: Luhn (Markov Chain + BIN Database)\n';
      outputText += `Success: ${cardInfoList.length}/${quantity} cards (deduplicated)\n`;
      if (failedCards.length > 0) {
        outputText += `Failed: ${failedCards.join(', ')}\n`;
      }
      outputText += '\n';

      // Add card details
      cardInfoList.forEach((cardInfo) => {
        outputText += `${cardInfo.cardNumber.replace(/\s/g, '')}|${cardInfo.expiryDate}|${cardInfo.cvc}\n`;
      });

      $('#cardOutput').val(outputText);

      console.log(`=== [${timestamp}] Card Generation Complete ===`);
      console.log(`🔢 Generated: ${cardInfoList.length}/${quantity} unique cards`);
      console.log(`💳 BIN: ${selectedBin}`);
      console.log(`🏷️ Brand: ${firstCard.cardBrand}`);
      console.log(`🏦 Bank: ${firstCard.bank}`);

    } catch (error) {
      console.error('Card generation failed:', error);
      $('#cardOutput').val(`Generation failed: ${error.message}`);
    }
  }

  // ========== Auto Try Feature ==========

  /**
   * Check validation status by detecting Stripe error messages
   * @returns {Promise<{isSuccess: boolean, hasError: boolean, errorMessage: string}>}
   */
  async checkValidationStatus() {
    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        return { isSuccess: false, hasError: false, errorMessage: 'No active tab' };
      }

      const result = await browserAPI.tabs.sendMessage(tab.id, {
        action: 'checkValidation'
      });

      return result || { isSuccess: false, hasError: false, errorMessage: '' };
    } catch (error) {
      console.error('Failed to check validation status:', error);
      return { isSuccess: false, hasError: false, errorMessage: error.message };
    }
  }

  async startAutoTry() {
    const binOptions = [];
    $('#binSelect option').each(function() {
      binOptions.push($(this).val());
    });

    if (binOptions.length === 0) {
      alert('❌ No BIN options available');
      return;
    }

    const tryCount = prompt('Enter number of auto-try attempts (recommended 1-10):', '5');

    if (!tryCount || isNaN(tryCount) || parseInt(tryCount) <= 0) {
      return;
    }

    const count = parseInt(tryCount);

    if (count > 100) {
      alert('❌ Maximum 100 attempts allowed for safety');
      return;
    }
    const delay = DELAYS.AUTO_TRY_INTERVAL;

    const confirmed = confirm(
      `Will perform ${count} auto-try attempts\n` +
      'Each time with random BIN and auto-fill\n' +
      `Interval: ${delay/1000} seconds\n` +
      'Will stop automatically if validation succeeds\n\n' +
      'Continue?'
    );

    if (!confirmed) {
      return;
    }

    console.log(`🔄 Starting auto-try, ${count} attempts with ${delay/1000}s validation delay`);

    const originalBin = $('#binSelect').val();
    const originalCustomBin = $('#customBinInput').val();

    $('#customBinInput').val(''); // Clear custom BIN

    let successfulBin = null;

    for (let i = 0; i < count; i++) {
      try {
        const randomBin = binOptions[Math.floor(Math.random() * binOptions.length)];
        console.log(`\n🎲 Attempt ${i + 1}/${count}, using BIN: ${randomBin}`);

        $('#binSelect').val(randomBin);
        await this.saveBinSelection(randomBin);
        await this.fillForm();

        // Wait for Stripe to validate
        console.log(`⏳ Waiting ${delay/1000} seconds for validation...`);
        await this.sleep(delay);

        // Check validation status
        const validationStatus = await this.checkValidationStatus();
        console.log('Validation status:', validationStatus);

        if (validationStatus.isSuccess) {
          console.log(`\n🎉 Success! BIN ${randomBin} passed validation!`);
          successfulBin = randomBin;
          alert(
            `🎉 Success!\n\n` +
            `BIN ${randomBin} passed validation!\n` +
            `Attempt ${i + 1}/${count}\n\n` +
            `This BIN has been kept selected for you.`
          );
          break; // Stop trying, we found a working BIN
        } else if (validationStatus.hasError) {
          console.log(`❌ Validation failed: ${validationStatus.errorMessage}`);
        } else {
          console.log(`⚠️ No clear validation result yet`);
        }

      } catch (error) {
        console.error(`❌ Attempt ${i + 1} failed:`, error);
      }
    }

    // Restore original settings only if we didn't find a successful BIN
    if (!successfulBin) {
      $('#binSelect').val(originalBin);
      $('#customBinInput').val(originalCustomBin);
      await this.saveBinSelection(originalBin);

      console.log(`\n⚠️ Auto-try complete, executed ${count} attempts, no success detected`);
      alert(
        `⚠️ Auto-try complete\n\n` +
        `Executed ${count} attempts\n` +
        `No successful validation detected\n` +
        `Original BIN settings restored`
      );
    } else {
      console.log(`\n✅ Auto-try complete with success on BIN: ${successfulBin}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========== Form Filling ==========

  async fillForm() {
    try {
      const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        alert('❌ Unable to get current page information');
        return;
      }

      // Check if restricted page
      if (this.isRestrictedUrl(tab.url)) {
        alert('⚠️ Cannot use on this page\n\nPlease use on a payment page, such as:\n• cursor.com checkout page\n• Other payment pages\n\nClick "Go to Checkout" to navigate automatically');
        return;
      }

      console.log('🎯 Starting card fill');
      console.log('📍 Current page:', tab.url);
      await this.fillCardForm();

    } catch (error) {
      console.error('Fill failed:', error);
      if (error.message && error.message.includes('Cannot access')) {
        alert('❌ Cannot run on this page\n\nPlease switch to a payment page and try again');
      } else {
        alert('❌ Fill failed, please ensure page is fully loaded');
      }
    }
  }

  isRestrictedUrl(url) {
    if (!url) {
      return true;
    }

    return RESTRICTED_URL_PREFIXES.some(prefix => url.startsWith(prefix));
  }

  async fillCardForm() {
    try {
      console.log('🔄 Preparing card fill data...');

      // Generate person info using Faker
      faker.locale = 'en';
      const province = faker.address.stateAbbr();
      const city = faker.address.city();

      // Get selected BIN
      const selectedBin = this.getSelectedBin();

      // Generate card info
      let cardInfo;
      try {
        cardInfo = await CardGenerator.generateCardInfo(selectedBin);
      } catch (error) {
        console.error('Card generation failed:', error.message);
        return;
      }

      // Get real address
      let addressInfo;
      try {
        addressInfo = await addressDatabase.getRealAddress(city, province);
      } catch (error) {
        console.warn('Address fetch failed, using Faker:', error);
        addressInfo = {
          street: faker.address.streetAddress(),
          zip: faker.address.zipCodeByState(province),
          source: 'faker'
        };
      }

      // Generate full name from database
      const fullName = await PersonGenerator.generateFullName();

      const data = {
        cardNumber: cardInfo.cardNumber,
        expiryDate: cardInfo.expiryDate,
        cvc: cardInfo.cvc,
        fullName: fullName,
        country: 'US',
        province: province,
        city: city,
        address: addressInfo.street,
        addressLine2: faker.address.secondaryAddress(),
        postalCode: addressInfo.zip
      };

      // Log generated info
      const timestamp = new Date().toLocaleString('zh-CN');
      console.log(`=== [${timestamp}] Generated Card Info ===`);
      console.log('💳 Payment Method: Card');
      console.log('👤 Name:', data.fullName);
      console.log('💳 Card Number:', data.cardNumber, `(BIN: ${selectedBin})`);
      console.log('🏷️ Brand:', cardInfo.cardBrand);
      console.log('🏦 Bank:', cardInfo.bank);
      console.log('🌍 Country:', cardInfo.country);
      console.log('📅 Expiry:', data.expiryDate);
      console.log('🔒 CVC:', data.cvc);
      console.log('🏛️ State:', data.province);
      console.log('🏙️ City:', data.city);
      console.log('🏠 Address:', data.address, `[${addressInfo.source}]`);
      console.log('📮 ZIP:', data.postalCode);
      console.log('=======================================');

      // Send to background script
      console.log('📤 Sending message to background for card fill...');
      const response = await browserAPI.runtime.sendMessage({
        action: 'fillCardForm',
        data: data
      });

      if (response && response.success) {
        console.log('✅', response.message);
        console.log('💡 Tip: Fill process continues in background, closing popup won\'t interrupt');
      } else {
        console.error('Fill failed:', response ? response.message : 'Unknown error');
      }

    } catch (error) {
      console.error('Card fill failed:', error);
      if (typeof faker === 'undefined') {
        console.log('Faker.js not loaded, please check file path', 'error');
      }
    }
  }
}

// Initialize when document is ready
$(document).ready(() => {
  new AutoFillManager();
});

