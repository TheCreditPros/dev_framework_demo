/* eslint-env browser, node */
/* global document, window, btoa */
import { vi, expect } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.TCP_DOMAIN = 'credit_repair';
process.env.FCRA_COMPLIANCE_MODE = 'true';

// Custom Vitest DOM matchers (pure Vitest, no Jest dependencies)
expect.extend({
  toBeInTheDocument(received) {
    const pass =
      received !== null &&
      received !== undefined &&
      document.contains(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to be in the document`
          : `Expected element to be in the document`,
    };
  },

  toHaveTextContent(received, expected) {
    const pass =
      received?.textContent === expected ||
      received?.textContent?.includes(expected);
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have text content "${expected}"`
          : `Expected element to have text content "${expected}", but got "${received?.textContent}"`,
    };
  },

  toHaveStyle(received, expected) {
    if (!received || !expected)
      return { pass: false, message: () => 'Element or styles not found' };

    const styles = window.getComputedStyle(received);
    const passes = Object.entries(expected).every(([prop, value]) => {
      // Convert camelCase to kebab-case for CSS property names
      const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      const actualValue = styles.getPropertyValue(cssProperty) || styles[prop];

      // Normalize RGB values - sometimes computed styles return rgb() format
      const normalizeColor = (color) => {
        if (!color) return '';
        if (color.startsWith('#')) return color.toLowerCase();
        if (color.startsWith('rgb(')) {
          // Convert rgb(34, 197, 94) to #22c55e
          const matches = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (matches) {
            const [, r, g, b] = matches;
            return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
          }
        }
        return color;
      };

      const normalizedActual = normalizeColor(actualValue);
      const normalizedExpected = normalizeColor(value);

      return normalizedActual === normalizedExpected || actualValue === value;
    });

    return {
      pass: passes,
      message: () =>
        passes
          ? `Expected element not to have matching styles`
          : `Expected element to have styles but they didn't match`,
    };
  },
});

// Mock console methods in test environment
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Credit repair domain test utilities
global.mockCreditData = {
  validScore: 720,
  invalidScore: 900,
  validPurpose: 'credit_application',
  invalidPurpose: 'invalid_purpose',
  sampleFactors: [
    'Payment history: 35%',
    'Credit utilization: 30%',
    'Length of credit history: 15%',
  ],
};

// FCRA compliance test helpers
global.fcraTestHelpers = {
  validateScoreRange: (score) => score >= 300 && score <= 850,
  mockAuditLog: (action, userId) => ({
    action,
    userId,
    timestamp: new Date().toISOString(),
    compliance: 'FCRA_604',
  }),
  encryptPII: (data) => `encrypted_${btoa(data)}`,
};
