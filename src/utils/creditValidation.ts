/**
 * Credit validation utilities for FCRA compliance
 * The Credit Pros - Credit Repair Domain
 */

export interface CreditData {
  score: number;
  reportDate: string;
  bureauSource: 'Experian' | 'Equifax' | 'TransUnion';
  permissiblePurpose: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates FICO credit score range (300-850)
 * Per FCRA Section 607 requirements
 */
export function validateCreditScore(score: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // FCRA Section 607 - Credit score range validation
  if (typeof score !== 'number') {
    errors.push('Credit score must be a number');
  } else if (score < 300 || score > 850) {
    errors.push(`Invalid FICO score: ${score}. Must be between 300-850.`);
  } else if (score < 350) {
    warnings.push('Extremely low credit score - verify data accuracy');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates permissible purpose per FCRA Section 604
 * Required for all credit report access
 */
export function validatePermissiblePurpose(purpose: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const validPurposes = [
    'credit_application',
    'account_review',
    'collection_activity',
    'employment_screening',
    'insurance_underwriting',
    'tenant_screening',
    'legitimate_business_need',
  ];

  if (!purpose || typeof purpose !== 'string') {
    errors.push('Permissible purpose is required per FCRA Section 604');
  } else if (!validPurposes.includes(purpose)) {
    errors.push(`Invalid permissible purpose: ${purpose}`);
    warnings.push('Ensure compliance with FCRA Section 604 requirements');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates complete credit data structure
 * Ensures FCRA compliance across all fields
 */
export function validateCreditData(
  data: Partial<CreditData>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!data.score) {
    errors.push('Credit score is required');
  } else {
    const scoreValidation = validateCreditScore(data.score);
    errors.push(...scoreValidation.errors);
    warnings.push(...scoreValidation.warnings);
  }

  if (!data.permissiblePurpose) {
    errors.push('Permissible purpose is required');
  } else {
    const purposeValidation = validatePermissiblePurpose(
      data.permissiblePurpose
    );
    errors.push(...purposeValidation.errors);
    warnings.push(...purposeValidation.warnings);
  }

  if (!data.reportDate) {
    errors.push('Report date is required');
  } else {
    const reportDate = new Date(data.reportDate);
    const now = new Date();
    const daysDiff =
      (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 90) {
      warnings.push(
        'Credit report is older than 90 days - consider refreshing'
      );
    }
  }

  if (!data.bureauSource) {
    errors.push('Bureau source is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculates credit score improvement potential
 * Used for dispute resolution planning
 */
export function calculateScoreImprovement(
  currentScore: number,
  negativeItems: number
): { potentialScore: number; improvementPoints: number } {
  const scoreValidation = validateCreditScore(currentScore);

  if (!scoreValidation.isValid) {
    throw new Error('Invalid current credit score');
  }

  // Conservative improvement calculation
  // Each negative item removal can improve score by 10-50 points
  const averageImprovement = 25;
  const potentialImprovement = Math.min(
    negativeItems * averageImprovement,
    200
  );
  const potentialScore = Math.min(currentScore + potentialImprovement, 850);

  return {
    potentialScore,
    improvementPoints: potentialScore - currentScore,
  };
}
