/**
 * Browser API Polyfill
 * Provides cross-browser compatibility between Chrome and Firefox
 *
 * Chrome uses chrome.* APIs
 * Firefox supports both browser.* (preferred) and chrome.* (compatibility)
 * This polyfill ensures consistent usage across browsers
 */

// Export a unified browser API object
export const browserAPI = (() => {
  // Firefox and other browsers that support the standard browser.* namespace
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser;
  }

  // Chrome and Chromium-based browsers use chrome.* namespace
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome;
  }

  // Test environment fallback (Node.js/Jest)
  // Return a mock object to prevent errors during testing
  if (typeof globalThis !== 'undefined' && typeof window === 'undefined') {
    return globalThis.chrome || null;
  }

  // Browser extension context - should not reach here
  return null;
})();

// Helper to check if we're running in Firefox
export const isFirefox = typeof browser !== 'undefined' && browser.runtime;

// Helper to check if we're running in Chrome
export const isChrome = typeof chrome !== 'undefined' && chrome.runtime && !isFirefox;

// Helper to check if we're in a test environment
export const isTestEnvironment = browserAPI === null;

/**
 * Cross-browser executeScript wrapper
 * Handles differences between Manifest V2 (tabs.executeScript) and Manifest V3 (scripting.executeScript)
 *
 * @param {number} tabId - The tab ID to execute script in
 * @param {Object} options - Script execution options
 * @param {Function} [options.func] - Function to execute (MV3 style)
 * @param {string} [options.code] - Code string to execute (MV2 style)
 * @param {Array} [options.args] - Arguments to pass to the function (MV3 style)
 * @returns {Promise<Array>} - Execution results
 */
export async function executeScript(tabId, options) {
  // Check if scripting API is available (Manifest V3 - Chrome)
  if (browserAPI.scripting && browserAPI.scripting.executeScript) {
    // Manifest V3 style
    return await browserAPI.scripting.executeScript({
      target: { tabId: tabId },
      func: options.func,
      args: options.args || []
    });
  }

  // Fallback to tabs.executeScript (Manifest V2 - Firefox)
  if (browserAPI.tabs && browserAPI.tabs.executeScript) {
    let code;

    // If func is provided, convert it to code string
    if (options.func) {
      const args = options.args || [];
      code = `(${options.func.toString()})(${args.map(arg => JSON.stringify(arg)).join(', ')})`;
    } else if (options.code) {
      code = options.code;
    } else {
      throw new Error('Either func or code must be provided');
    }

    const result = await browserAPI.tabs.executeScript(tabId, { code: code });
    // Wrap result to match MV3 format: [{ result: value }]
    return result.map(value => ({ result: value }));
  }

  throw new Error('No script execution API available');
}

export default browserAPI;

