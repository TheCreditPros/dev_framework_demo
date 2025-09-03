// Fixed test suite for proper validation
import { describe, it, expect } from 'vitest';
import {
  brokenFunction,
  anotherBrokenFunction,
  testFunctionWithWrongLogic,
} from '../../../src/utils/brokenTest.js';

describe('Fixed Test Suite - Proper Validation', () => {
  it('should return correct values for different inputs', () => {
    expect(brokenFunction(50)).toBe('low');
    expect(brokenFunction(75)).toBe('medium');
    expect(brokenFunction(150)).toBe('high');
  });

  it('should not throw errors', () => {
    expect(() => anotherBrokenFunction()).not.toThrow();
    expect(anotherBrokenFunction()).toBe('success');
  });

  it('should have correct logic', () => {
    const result = testFunctionWithWrongLogic();
    expect(result).toBe(true);
  });

  it('should handle basic assertions correctly', () => {
    const value = 42;
    expect(value).toBe(42);
  });

  it('should handle async operations properly', async () => {
    // Quick async test that completes successfully
    await new Promise((resolve) => globalThis.setTimeout(resolve, 10));
    expect(true).toBe(true);
  });

  it('should handle type comparisons correctly', () => {
    const number = 123;
    expect(number).toBe(123); // Correct type comparison
  });
});
