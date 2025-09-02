// Intentional broken tests for Vitest validation
import { describe, it, expect } from 'vitest';
import { brokenFunction, anotherBrokenFunction, testFunctionWithWrongLogic } from '../../src/utils/brokenTest.js';

describe('Broken Test Suite - Intentional Failures', () => {
  it('should fail - broken function returns undefined', () => {
    const result = brokenFunction(50);
    expect(result).toBe('low'); // This will fail because function returns undefined
  });

  it('should fail - function throws error', () => {
    expect(() => anotherBrokenFunction()).not.toThrow(); // This will fail because function does throw
  });

  it('should fail - wrong logic test', () => {
    const result = testFunctionWithWrongLogic();
    expect(result).toBe(true); // This will fail because function returns false
  });

  it('should fail - assertion mismatch', () => {
    const value = 42;
    expect(value).toBe(24); // This will fail - wrong expected value
  });

  it('should fail - async test timeout', async () => {
    // This test will timeout
    await new Promise(resolve => globalThis.setTimeout(resolve, 10000));
    expect(true).toBe(true);
  }, 100); // 100ms timeout to make it fail quickly

  it('should fail - type mismatch', () => {
    const number = 123;
    expect(number).toBe('123'); // This will fail - number vs string
  });
});
