/**
 * Background Service Worker
 * Handles long-running tasks and form filling injection
 * Cross-browser compatible (Chrome, Firefox, Edge)
 */

import { Sleep } from './src/utils/sleep.js';
import { FormFiller } from './src/core/form-filler.js';
import { DELAYS, RETRY_LIMITS } from './src/utils/constants.js';
import { browserAPI, executeScript } from './src/utils/browser-polyfill.js';

console.log('Background Service Worker started');

// Extension installation handler
browserAPI.runtime.onInstalled.addListener(() => {
  console.log('Extension installed or updated');
});

// Message listener from popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action);

  switch (request.action) {
  case 'fillCardForm':
    handleFillCardForm(request.data);
    sendResponse({ success: true, message: 'Card fill process started' });
    break;

  default:
    sendResponse({ success: false, message: 'Unknown action' });
  }

  // Keep message channel open
  return true;
});

/**
 * Handle card form filling
 * @param {Object} data - Card data to fill
 */
async function handleFillCardForm(data) {
  try {
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      console.error('❌ Unable to get current tab');
      return;
    }

    if (FormFiller.isRestrictedUrl(tab.url)) {
      console.error('❌ Cannot run on this page:', tab.url);

      try {
        await executeScript(tab.id, {
          func: () => {
            alert('⚠️ Cannot use card fill on this page\n\nPlease use on a payment page (e.g., cursor.com checkout)');
          }
        });
      } catch (notifyError) {
        console.error('Cannot show notification:', notifyError);
      }
      return;
    }

    console.log('🔄 Background: Starting card fill process');
    console.log('📍 Current page:', tab.url);

    // Step 1: Select card payment method
    await executeScript(tab.id, {
      func: selectCardPaymentMethod
    });

    // Step 2: Wait for payment method switch
    await Sleep.sleep(DELAYS.PAYMENT_METHOD_SWITCH);

    // Step 3: Inject fill script with data
    await executeScript(tab.id, {
      func: executeCardFillProcess,
      args: [data]
    });

    console.log('✅ Background: Card fill script injected, will run independently on page');

  } catch (error) {
    console.error('Background: Card fill failed:', error);

    if (error.message && error.message.includes('chrome://')) {
      console.error('❌ Cannot run on browser internal pages, please switch to payment page');
    } else if (error.message && error.message.includes('Cannot access')) {
      console.error('❌ Page access restricted, ensure you are on the correct payment page');
    }
  }
}

// ========== Injected Functions (run in page context) ==========

/**
 * Select card payment method
 * Injected into page context
 */
async function selectCardPaymentMethod() {
  console.log('\n━━━ 💳 Card Payment Method Selection Started ━━━');

  // Define constants inside the function since it runs in page context
  const DELAYS = {
    PAGE_READY: 300,
    SUBMIT_RETRY_INTERVAL: 500
  };
  const RETRY_LIMITS = {
    PAYMENT_METHOD_BUTTON: 60
  };

  const robustSleep = async (ms) => {
    const startTime = Date.now();
    const endTime = startTime + ms;
    while (Date.now() < endTime) {
      await new Promise(resolve => setTimeout(resolve, Math.min(100, endTime - Date.now())));
    }
  };

  console.log('⏳ Page preparing...');
  await robustSleep(DELAYS.PAGE_READY);

  console.log('🔍 Looking for card payment method...');
  let cardButton = null;
  let attempts = 0;
  const maxAttempts = RETRY_LIMITS.PAYMENT_METHOD_BUTTON;

  while (attempts < maxAttempts && !cardButton) {
    attempts++;
    console.log(`Looking for card payment method... (attempt ${attempts})`);

    const element = document.querySelector('button[data-testid=card-accordion-item-button]');
    if (element) {
      cardButton = element;
      console.log(`✅ Found card payment method (attempt ${attempts})`);
      cardButton.click();
      console.log('✅ Clicked card payment method');
      break;
    }

    await robustSleep(DELAYS.SUBMIT_RETRY_INTERVAL);
  }

  if (!cardButton) {
    console.log(`⚠️ Timeout: card payment method not found (tried ${attempts} times)`);
    return;
  }

  await robustSleep(DELAYS.SUBMIT_RETRY_INTERVAL);

  // Enable annual subscription
  const yearSwitch = document.querySelector('.HostedSwitch');
  if (yearSwitch) {
    if (yearSwitch.getAttribute('aria-checked') !== 'true') {
      yearSwitch.click();
      console.log('✅ Enabled annual subscription');
    } else {
      console.log('✅ Annual subscription already enabled');
    }
  }

  // Click manual address entry button (only appears on first time)
  await robustSleep(DELAYS.PAGE_READY);
  console.log('🔍 Looking for manual address entry button...');
  const manualAddressButton = document.querySelector('.AddressAutocomplete-manual-entry .Button');

  if (manualAddressButton) {
    console.log('✅ Found manual address entry button');
    manualAddressButton.click();
    console.log('✅ Clicked manual address entry button');
  } else {
    console.log('⚠️ Manual address entry button not found (may not be first time)');
  }
}

/**
 * Execute card fill process
 * Injected into page context
 * @param {Object} data - Card data to fill
 */
function executeCardFillProcess(data) {
  console.log('💳 Starting independent card fill process');

  // Define constants inside the function since it runs in page context
  const DELAYS = {
    FIELD_FILL: 100,
    BETWEEN_FIELDS: 100,
    NOTIFICATION_DISPLAY: 3000,
    SUBMIT_TIMEOUT: 8000,
    SUBMIT_RETRY_INTERVAL: 500
  };

  // Sleep function for delays
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Handle submit with timeout
  async function handleSubmitWithTimeout(cardSubmit) {
    console.log('🚀 Preparing to auto-submit form...');
    let shouldStop = false;
    let submitSuccess = false;

    const timer = setInterval(() => {
      if (shouldStop) {
        clearInterval(timer);
        return;
      }

      cardSubmit.click();
      const submitProcess = document.querySelector('span[data-testid=submit-button-processing-label]');
      if (submitProcess && submitProcess.getAttribute('aria-hidden') === 'false') {
        clearInterval(timer);
        submitSuccess = true;
        shouldStop = true;
        console.log('✅ Form submitted');
      }
    }, DELAYS.SUBMIT_RETRY_INTERVAL);

    // Submit timeout
    (async () => {
      await sleep(DELAYS.SUBMIT_TIMEOUT);
      if (!submitSuccess) {
        shouldStop = true;
        clearInterval(timer);
        console.log('⏱️ Submit timeout (card method does not auto-redirect)');
      }
    })();
  }

  // Main execution function
  (async function() {
    try {
      console.log('📋 Fill data:', data);
      await fillWebPageFormCard(data);
      console.log('✅ Card fill process complete (independent execution)');
    } catch (error) {
      console.error('Card fill failed:', error);
    }
  })();

  // Fill card form function
  async function fillWebPageFormCard(data) {
    console.log('💳 Card fill mode - starting field fill');

    const fieldSelectors = {
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

    function fillField(selectors, value) {
      if (!value) {
        return false;
      }

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element) {
            if (element.tagName.toLowerCase() === 'select') {
              const option = element.querySelector(`option[value="${value}"]`);
              if (option) {
                element.value = value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                console.log(`✅ Set select: ${selector} = ${value}`);
                return true;
              } else {
                const options = element.querySelectorAll('option');
                for (const opt of options) {
                  const optText = opt.textContent.toLowerCase();
                  const optValue = opt.value.toLowerCase();

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

                  if (optText.includes(value.toLowerCase()) || optValue.includes(value.toLowerCase())) {
                    element.value = opt.value;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ Set select (fuzzy match): ${selector} = ${opt.value}`);
                    return true;
                  }
                }
                console.log(`❌ No matching option: ${selector}, looking for: ${value}`);
              }
            } else {
              element.value = value;
              const events = ['input', 'change', 'blur', 'keyup'];
              events.forEach(eventType => {
                element.dispatchEvent(new Event(eventType, { bubbles: true }));
              });

              if (element._valueTracker) {
                element._valueTracker.setValue('');
              }

              console.log(`✅ Set input: ${selector} = ${value}`);
              return true;
            }
          }
        }
      }
      return false;
    }

    const fillOrder = [
      'cardNumber', 'expiryDate', 'cvc', 'fullName',
      'country', 'province', 'city', 'postalCode',
      'address', 'addressLine2'
    ];

    let filledCount = 0;
    const results = {};

    async function delayFillField(index) {
      if (index >= fillOrder.length) {
        const fillTimestamp = new Date().toLocaleString('zh-CN');
        console.log(`=== [${fillTimestamp}] Card Form Fill Results ===`);
        console.log(`✅ Successfully filled: ${filledCount} fields`);
        console.log('📊 Details:', results);

        await sleep(DELAYS.SUBMIT_RETRY_INTERVAL);

        if (Object.values(results).filter(v => v === true).length >= 8) {
          const cardSubmit = document.querySelector('button[data-testid=hosted-payment-submit-button]');
          if (cardSubmit) {
            handleSubmitWithTimeout(cardSubmit);
          }
        }

        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          z-index: 999999;
          font-family: Arial, sans-serif;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notification.textContent = `💳 Filled ${filledCount} card fields`;
        document.body.appendChild(notification);

        await sleep(DELAYS.NOTIFICATION_DISPLAY);
        if (notification.parentNode) {
          notification.remove();
        }
        return;
      }

      const field = fillOrder[index];
      const fieldValue = data[field];

      const fieldNames = {
        cardNumber: '卡号',
        expiryDate: '有效期',
        cvc: 'CVC',
        fullName: '持卡人',
        country: '国家',
        province: '州/省',
        city: '城市',
        postalCode: '邮编',
        address: '地址第一行',
        addressLine2: '地址第二行'
      };

      console.log(`⏳ [${index + 1}/${fillOrder.length}] Filling: ${fieldNames[field]} (${field})`);

      if (fieldValue && fieldSelectors[field]) {
        const success = fillField(fieldSelectors[field], fieldValue);
        results[field] = success;
        if (success) {
          filledCount++;
          console.log(`✅ ${fieldNames[field]} filled: ${fieldValue}`);
        } else {
          console.log(`❌ ${fieldNames[field]} fill failed`);
        }
      } else {
        results[field] = false;
        console.log(`⚠️ ${fieldNames[field]} no data or selector`);
      }

      await sleep(DELAYS.BETWEEN_FIELDS);
      await delayFillField(index + 1);
    }

    console.log('⏳ Waiting before starting card fill...');
    await sleep(DELAYS.FIELD_FILL);
    console.log('🎯 Starting sequential card fill...');
    await delayFillField(0);
  }
}

