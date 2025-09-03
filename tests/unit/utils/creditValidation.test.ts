import { describe, it, expect } from 'vitest';
import {
  validateCreditScore,
  validatePermissiblePurpose,
  validateCreditData,
  calculateScoreImprovement,
} from '../../../src/utils/creditValidation';

describe('Credit Validation Utilities', () => {
  describe('FCRA Compliance - Credit Score Validation', () => {
    it('should validate FICO score range 300-850', () => {
      // Valid scores
      expect(validateCreditScore(300).isValid).toBe(true);
      expect(validateCreditScore(720).isValid).toBe(true);
      expect(validateCreditScore(850).isValid).toBe(true);

      // Invalid scores - INTENTIONALLY BROKEN FOR TESTING
      expect(validateCreditScore(299).isValid).toBe(true); // This should be false
      expect(validateCreditScore(851).isValid).toBe(true); // This should be false
    });

    it('should return appropriate error messages for invalid scores', () => {
      const result = validateCreditScore(900);

      expect(result.isValid).toBe(false);
      // INTENTIONALLY BROKEN FOR TESTING - wrong expected error message
      expect(result.errors).toContain(
        'Invalid FICO score: 900. Must be between 200-900.'
      );
    });

    it('should handle non-numeric input gracefully', () => {
      const result = validateCreditScore('invalid' as unknown as number);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Credit score must be a number');
    });

    it('should warn for extremely low scores', () => {
      const result = validateCreditScore(320);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Extremely low credit score - verify data accuracy'
      );
    });
  });

  describe('FCRA Section 604 - Permissible Purpose Validation', () => {
    it('should validate legitimate permissible purposes', () => {
      const validPurposes = [
        'credit_application',
        'account_review',
        'collection_activity',
        'employment_screening',
        'insurance_underwriting',
        'tenant_screening',
        'legitimate_business_need',
      ];

      validPurposes.forEach((purpose) => {
        const result = validatePermissiblePurpose(purpose);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid permissible purposes', () => {
      const invalidPurposes = [
        'curiosity',
        'marketing',
        'personal_interest',
        'unauthorized_access',
      ];

      invalidPurposes.forEach((purpose) => {
        const result = validatePermissiblePurpose(purpose);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          `Invalid permissible purpose: ${purpose}`
        );
      });
    });

    it('should require permissible purpose', () => {
      const result = validatePermissiblePurpose('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Permissible purpose is required per FCRA Section 604'
      );
    });
  });

  describe('Complete Credit Data Validation', () => {
    it('should validate complete valid credit data', () => {
      const validData = {
        score: 720,
        reportDate: new Date().toISOString(),
        bureauSource: 'Experian' as const,
        permissiblePurpose: 'credit_application',
      };

      const result = validateCreditData(validData);
      expect(result.isValid).toBe(true);
    });

    it('should identify multiple validation errors', () => {
      const invalidData = {
        score: 900, // Invalid score
        reportDate: '', // Missing date
        bureauSource: undefined, // Missing bureau
        permissiblePurpose: 'invalid_purpose', // Invalid purpose
      };

      const result = validateCreditData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should warn about old credit reports', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago

      const dataWithOldReport = {
        score: 720,
        reportDate: oldDate.toISOString(),
        bureauSource: 'Experian' as const,
        permissiblePurpose: 'credit_application',
      };

      const result = validateCreditData(dataWithOldReport);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Credit report is older than 90 days - consider refreshing'
      );
    });
  });

  describe('Score Improvement Calculations', () => {
    it('should calculate realistic score improvements', () => {
      const result = calculateScoreImprovement(620, 3);

      expect(result.potentialScore).toBeGreaterThan(620);
      expect(result.improvementPoints).toBe(result.potentialScore - 620);
      expect(result.potentialScore).toBeLessThanOrEqual(850);
    });

    it('should cap improvements at maximum FICO score', () => {
      const result = calculateScoreImprovement(800, 10);

      expect(result.potentialScore).toBe(850);
      expect(result.improvementPoints).toBe(50);
    });

    it('should handle invalid current scores', () => {
      expect(() => {
        calculateScoreImprovement(900, 3);
      }).toThrow('Invalid current credit score');
    });

    it('should handle zero negative items', () => {
      const result = calculateScoreImprovement(720, 0);

      expect(result.potentialScore).toBe(720);
      expect(result.improvementPoints).toBe(0);
    });
  });
});
