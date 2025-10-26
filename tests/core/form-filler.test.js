/**
 * Tests for Form Filler
 */

import { FormFiller } from '../../src/core/form-filler.js';

describe('FormFiller', () => {
  let mockDocument;

  beforeEach(() => {
    // Create a mock document for each test
    mockDocument = {
      querySelectorAll: jest.fn(),
      querySelector: jest.fn()
    };
    global.document = mockDocument;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Field Selectors', () => {
    test('should have card field selectors defined', () => {
      expect(FormFiller.CARD_FIELD_SELECTORS).toHaveProperty('cardNumber');
      expect(FormFiller.CARD_FIELD_SELECTORS).toHaveProperty('expiryDate');
      expect(FormFiller.CARD_FIELD_SELECTORS).toHaveProperty('cvc');
      expect(FormFiller.CARD_FIELD_SELECTORS).toHaveProperty('fullName');
    });

    test('should have bank field selectors defined', () => {
      expect(FormFiller.BANK_FIELD_SELECTORS).toHaveProperty('accountHolderName');
      expect(FormFiller.BANK_FIELD_SELECTORS).toHaveProperty('country');
    });

    test('should have bank account modal selectors defined', () => {
      expect(FormFiller.BANK_ACCOUNT_MODAL_SELECTORS).toHaveProperty('routing');
      expect(FormFiller.BANK_ACCOUNT_MODAL_SELECTORS).toHaveProperty('account');
      expect(FormFiller.BANK_ACCOUNT_MODAL_SELECTORS).toHaveProperty('confirm');
    });
  });

  describe('fillField', () => {
    test('should return false if value is empty', () => {
      const result = FormFiller.fillField(['input[name=test]'], '');
      expect(result).toBe(false);
    });

    test('should return false if value is null', () => {
      const result = FormFiller.fillField(['input[name=test]'], null);
      expect(result).toBe(false);
    });

    test('should return false if value is undefined', () => {
      const result = FormFiller.fillField(['input[name=test]'], undefined);
      expect(result).toBe(false);
    });

    test('should fill input field when found', () => {
      const mockInput = {
        tagName: 'INPUT',
        value: '',
        dispatchEvent: jest.fn(),
        _valueTracker: null
      };

      mockDocument.querySelectorAll.mockReturnValue([mockInput]);

      const result = FormFiller.fillField(['input[name=test]'], 'test value');

      expect(result).toBe(true);
      expect(mockInput.value).toBe('test value');
      expect(mockInput.dispatchEvent).toHaveBeenCalledTimes(4); // input, change, blur, keyup
    });

    test('should fill select field when found', () => {
      const mockOption = { value: 'US', textContent: 'United States' };
      const mockSelect = {
        tagName: 'SELECT',
        value: '',
        querySelector: jest.fn().mockReturnValue(mockOption),
        dispatchEvent: jest.fn()
      };

      mockDocument.querySelectorAll.mockReturnValue([mockSelect]);

      const result = FormFiller.fillField(['select[name=country]'], 'US');

      expect(result).toBe(true);
      expect(mockSelect.value).toBe('US');
      expect(mockSelect.dispatchEvent).toHaveBeenCalled();
    });

    test('should try multiple selectors', () => {
      const mockInput = {
        tagName: 'INPUT',
        value: '',
        dispatchEvent: jest.fn(),
        _valueTracker: null
      };

      // First selector fails, second succeeds
      mockDocument.querySelectorAll
        .mockReturnValueOnce([])
        .mockReturnValueOnce([mockInput]);

      const result = FormFiller.fillField(
        ['input[name=wrong]', 'input[name=correct]'],
        'value'
      );

      expect(result).toBe(true);
      expect(mockInput.value).toBe('value');
    });

    test('should return false when no elements found', () => {
      mockDocument.querySelectorAll.mockReturnValue([]);

      const result = FormFiller.fillField(['input[name=notfound]'], 'value');

      expect(result).toBe(false);
    });

    test('should skip null elements', () => {
      mockDocument.querySelectorAll.mockReturnValue([null, null]);

      const result = FormFiller.fillField(['input[name=test]'], 'value');

      expect(result).toBe(false);
    });
  });

  describe('fillSelectField', () => {
    test('should fill select with exact value match', () => {
      const mockOption = { value: 'US', textContent: 'United States' };
      const mockSelect = {
        querySelector: jest.fn().mockReturnValue(mockOption),
        dispatchEvent: jest.fn(),
        value: ''
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = FormFiller.fillSelectField(mockSelect, 'US', 'select[name=country]');

      expect(result).toBe(true);
      expect(mockSelect.value).toBe('US');
      expect(mockSelect.querySelector).toHaveBeenCalledWith('option[value="US"]');
      expect(mockSelect.dispatchEvent).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    test('should match US variations for US country', () => {
      const mockOptions = [
        { value: 'usa', textContent: 'United States', dispatchEvent: jest.fn() },
        { value: 'uk', textContent: 'United Kingdom', dispatchEvent: jest.fn() }
      ];

      const mockSelect = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue(mockOptions),
        dispatchEvent: jest.fn(),
        value: ''
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = FormFiller.fillSelectField(mockSelect, 'US', 'select[name=country]');

      expect(result).toBe(true);
      expect(mockSelect.value).toBe('usa');

      consoleLogSpy.mockRestore();
    });

    test('should perform fuzzy matching on options', () => {
      const mockOptions = [
        { value: 'california', textContent: 'California', dispatchEvent: jest.fn() },
        { value: 'colorado', textContent: 'Colorado', dispatchEvent: jest.fn() }
      ];

      const mockSelect = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue(mockOptions),
        dispatchEvent: jest.fn(),
        value: ''
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = FormFiller.fillSelectField(mockSelect, 'CA', 'select[name=state]');

      expect(result).toBe(true);
      expect(mockSelect.value).toBe('california');

      consoleLogSpy.mockRestore();
    });

    test('should return false when no match found', () => {
      const mockOptions = [
        { value: 'uk', textContent: 'United Kingdom', dispatchEvent: jest.fn() }
      ];

      const mockSelect = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue(mockOptions),
        dispatchEvent: jest.fn(),
        value: ''
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = FormFiller.fillSelectField(mockSelect, 'ZZ', 'select[name=country]');

      expect(result).toBe(false);

      consoleLogSpy.mockRestore();
    });

    test('should dispatch change event', () => {
      const mockOption = { value: 'test', textContent: 'Test' };
      const mockSelect = {
        querySelector: jest.fn().mockReturnValue(mockOption),
        dispatchEvent: jest.fn(),
        value: ''
      };

      jest.spyOn(console, 'log').mockImplementation(() => {});

      FormFiller.fillSelectField(mockSelect, 'test', 'select');

      expect(mockSelect.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'change',
          bubbles: true
        })
      );
    });
  });

  describe('fillInputField', () => {
    test('should set input value', () => {
      const mockInput = {
        value: '',
        dispatchEvent: jest.fn(),
        _valueTracker: null
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = FormFiller.fillInputField(mockInput, 'test value', 'input[name=test]');

      expect(result).toBe(true);
      expect(mockInput.value).toBe('test value');

      consoleLogSpy.mockRestore();
    });

    test('should dispatch all required events', () => {
      const mockInput = {
        value: '',
        dispatchEvent: jest.fn(),
        _valueTracker: null
      };

      jest.spyOn(console, 'log').mockImplementation(() => {});

      FormFiller.fillInputField(mockInput, 'value', 'input');

      const eventTypes = mockInput.dispatchEvent.mock.calls.map(call => call[0].type);
      expect(eventTypes).toContain('input');
      expect(eventTypes).toContain('change');
      expect(eventTypes).toContain('blur');
      expect(eventTypes).toContain('keyup');
      expect(mockInput.dispatchEvent).toHaveBeenCalledTimes(4);
    });

    test('should handle React value tracker', () => {
      const mockInput = {
        value: '',
        dispatchEvent: jest.fn(),
        _valueTracker: {
          setValue: jest.fn()
        }
      };

      jest.spyOn(console, 'log').mockImplementation(() => {});

      FormFiller.fillInputField(mockInput, 'value', 'input');

      expect(mockInput._valueTracker.setValue).toHaveBeenCalledWith('');
    });

    test('should work without value tracker', () => {
      const mockInput = {
        value: '',
        dispatchEvent: jest.fn(),
        _valueTracker: null
      };

      jest.spyOn(console, 'log').mockImplementation(() => {});

      expect(() => {
        FormFiller.fillInputField(mockInput, 'value', 'input');
      }).not.toThrow();
    });

    test('should dispatch events with bubbles: true', () => {
      const mockInput = {
        value: '',
        dispatchEvent: jest.fn(),
        _valueTracker: null
      };

      jest.spyOn(console, 'log').mockImplementation(() => {});

      FormFiller.fillInputField(mockInput, 'value', 'input');

      mockInput.dispatchEvent.mock.calls.forEach(call => {
        expect(call[0].bubbles).toBe(true);
      });
    });
  });

  describe('getFieldName', () => {
    test('should return Chinese name for cardNumber', () => {
      expect(FormFiller.getFieldName('cardNumber')).toBe('卡号');
    });

    test('should return Chinese name for expiryDate', () => {
      expect(FormFiller.getFieldName('expiryDate')).toBe('有效期');
    });

    test('should return Chinese name for cvc', () => {
      expect(FormFiller.getFieldName('cvc')).toBe('CVC');
    });

    test('should return Chinese name for fullName', () => {
      expect(FormFiller.getFieldName('fullName')).toBe('持卡人');
    });

    test('should return Chinese name for country', () => {
      expect(FormFiller.getFieldName('country')).toBe('国家');
    });

    test('should return Chinese name for province', () => {
      expect(FormFiller.getFieldName('province')).toBe('州/省');
    });

    test('should return Chinese name for city', () => {
      expect(FormFiller.getFieldName('city')).toBe('城市');
    });

    test('should return Chinese name for postalCode', () => {
      expect(FormFiller.getFieldName('postalCode')).toBe('邮编');
    });

    test('should return Chinese name for address', () => {
      expect(FormFiller.getFieldName('address')).toBe('地址第一行');
    });

    test('should return original key if not found', () => {
      expect(FormFiller.getFieldName('unknownField')).toBe('unknownField');
    });

    test('should handle empty string', () => {
      expect(FormFiller.getFieldName('')).toBe('');
    });
  });

  describe('isRestrictedUrl', () => {
    test('should return true for null URL', () => {
      expect(FormFiller.isRestrictedUrl(null)).toBe(true);
    });

    test('should return true for undefined URL', () => {
      expect(FormFiller.isRestrictedUrl(undefined)).toBe(true);
    });

    test('should return true for empty URL', () => {
      expect(FormFiller.isRestrictedUrl('')).toBe(true);
    });

    test('should return true for chrome:// URLs', () => {
      expect(FormFiller.isRestrictedUrl('chrome://extensions')).toBe(true);
      expect(FormFiller.isRestrictedUrl('chrome://settings')).toBe(true);
    });

    test('should return true for about: URLs', () => {
      expect(FormFiller.isRestrictedUrl('about:blank')).toBe(true);
      expect(FormFiller.isRestrictedUrl('about:config')).toBe(true);
    });

    test('should return true for edge:// URLs', () => {
      expect(FormFiller.isRestrictedUrl('edge://settings')).toBe(true);
    });

    test('should return false for http URLs', () => {
      expect(FormFiller.isRestrictedUrl('http://example.com')).toBe(false);
    });

    test('should return false for https URLs', () => {
      expect(FormFiller.isRestrictedUrl('https://example.com')).toBe(false);
      expect(FormFiller.isRestrictedUrl('https://checkout.stripe.com')).toBe(false);
    });

    test('should return false for normal website URLs', () => {
      expect(FormFiller.isRestrictedUrl('https://www.google.com')).toBe(false);
      expect(FormFiller.isRestrictedUrl('https://cursor.com')).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    test('should fill multiple fields correctly', () => {
      const mockCardNumberInput = {
        tagName: 'INPUT',
        value: '',
        dispatchEvent: jest.fn(),
        _valueTracker: null
      };

      const mockCvcInput = {
        tagName: 'INPUT',
        value: '',
        dispatchEvent: jest.fn(),
        _valueTracker: null
      };

      mockDocument.querySelectorAll
        .mockReturnValueOnce([mockCardNumberInput])
        .mockReturnValueOnce([mockCvcInput]);

      jest.spyOn(console, 'log').mockImplementation(() => {});

      const cardResult = FormFiller.fillField(['input[name=cardNumber]'], '4111111111111111');
      const cvcResult = FormFiller.fillField(['input[name=cardCvc]'], '123');

      expect(cardResult).toBe(true);
      expect(cvcResult).toBe(true);
      expect(mockCardNumberInput.value).toBe('4111111111111111');
      expect(mockCvcInput.value).toBe('123');
    });

    test('should handle mixed input and select fields', () => {
      const mockInput = {
        tagName: 'INPUT',
        value: '',
        dispatchEvent: jest.fn(),
        _valueTracker: null
      };

      const mockOption = { value: 'US', textContent: 'United States' };
      const mockSelect = {
        tagName: 'SELECT',
        querySelector: jest.fn().mockReturnValue(mockOption),
        dispatchEvent: jest.fn(),
        value: ''
      };

      mockDocument.querySelectorAll
        .mockReturnValueOnce([mockInput])
        .mockReturnValueOnce([mockSelect]);

      jest.spyOn(console, 'log').mockImplementation(() => {});

      const inputResult = FormFiller.fillField(['input[name=name]'], 'John Doe');
      const selectResult = FormFiller.fillField(['select[name=country]'], 'US');

      expect(inputResult).toBe(true);
      expect(selectResult).toBe(true);
      expect(mockInput.value).toBe('John Doe');
      expect(mockSelect.value).toBe('US');
    });
  });
});

