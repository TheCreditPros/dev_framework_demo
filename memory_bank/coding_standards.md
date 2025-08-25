# Coding Standards - The Credit Pros AI-SDLC Framework

## General Principles

### SOLID Principles

- **Single Responsibility**: Each class/function has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Clients shouldn't depend on unused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

### Code Quality Standards

- **DRY (Don't Repeat Yourself)**: Eliminate code duplication
- **KISS (Keep It Simple, Stupid)**: Prefer simple solutions
- **YAGNI (You Aren't Gonna Need It)**: Don't build features until needed
- **Fail Fast**: Detect and handle errors early
- **Defensive Programming**: Always validate inputs and handle edge cases

## API Quality Gate Standards

### API Documentation Standards

```typescript
// Use descriptive endpoint summaries and detailed descriptions
/**
 * Retrieve credit report for consumer
 *
 * This endpoint fetches the complete credit report for a consumer, including
 * trade lines, payment history, and credit scores. The request must include
 * a valid permissible purpose as required by FCRA Section 604. All access
 * is logged for audit trail compliance.
 *
 * @param consumerId - Unique identifier for the consumer (UUID format)
 * @param purpose - Valid FCRA permissible purpose for credit access
 * @returns Complete credit report with compliance metadata
 */
app.get('/api/consumers/:consumerId/credit-report', [
  validatePermissiblePurpose,
  authenticate,
  authorize('credit_report_access')
], async (req: Request, res: Response) => {
  // Implementation
});
```

### Error Response Standards

```typescript
// Standardized error response format
interface APIError {
  error: string;        // Error category (e.g., 'VALIDATION_ERROR')
  message: string;      // User-friendly error message
  code: string;         // Machine-readable error code
  timestamp: string;    // ISO 8601 timestamp
  details?: any;        // Additional context (never contains PII)
  requestId?: string;   // For tracing and debugging
}

// Example error responses
const validationError: APIError = {
  error: 'VALIDATION_ERROR',
  message: 'Invalid consumer ID format. Expected UUID format.',
  code: 'INVALID_CONSUMER_ID',
  timestamp: new Date().toISOString(),
  requestId: 'req-12345'
};

const authError: APIError = {
  error: 'AUTHENTICATION_ERROR',
  message: 'Access token is invalid or expired.',
  code: 'INVALID_TOKEN',
  timestamp: new Date().toISOString(),
  requestId: 'req-12346'
};
```

### API Contract Testing Standards

```typescript
// Define clear request/response schemas
interface CreditReportRequest {
  consumerId: string;      // UUID format
  purpose: string;         // Valid FCRA purpose
  includeDisputes?: boolean; // Optional flag
}

interface CreditReportResponse {
  data: {
    consumerId: string;
    creditScore: number;     // 300-850 range
    reportDate: string;      // ISO 8601 date
    tradeLines: TradeLine[];
    summary: CreditSummary;
  };
  meta: {
    auditId: string;         // For compliance tracking
    retrievedAt: string;     // ISO 8601 timestamp
    complianceValidated: boolean;
  };
}
```

## TypeScript/JavaScript Standards

### File Organization

```typescript
// 1. External imports (third-party libraries)
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Internal imports (project modules)
import { CreditReport } from '../types/CreditReport';
import { validateSSN } from '../utils/validation';

// 3. Relative imports (same directory level)
import './CreditReportComponent.css';
```

### Function Standards

```typescript
// Use descriptive names with verb-noun pattern
function calculateCreditUtilization(
  balances: number[],
  limits: number[]
): number {
  // Always validate inputs
  if (!balances.length || !limits.length) {
    throw new Error(
      'Credit utilization calculation requires balance and limit data'
    );
  }

  // Single responsibility - only calculate utilization
  const totalBalance = balances.reduce((sum, balance) => sum + balance, 0);
  const totalLimit = limits.reduce((sum, limit) => sum + limit, 0);

  if (totalLimit === 0) {
    return 0; // Avoid division by zero
  }

  return Math.round((totalBalance / totalLimit) * 100);
}
```

### Component Standards

```typescript
// Use interfaces for props
interface CreditScoreDisplayProps {
  score: number;
  date: string;
  onScoreClick?: (score: number) => void;
  className?: string;
}

// Functional components with TypeScript
export const CreditScoreDisplay: React.FC<CreditScoreDisplayProps> = ({
  score,
  date,
  onScoreClick,
  className = ''
}) => {
  // Validate score range (FICO 300-850)
  const validScore = Math.min(Math.max(score, 300), 850);

  // Handle user interactions
  const handleScoreClick = () => {
    onScoreClick?.(validScore);
  };

  return (
    <div
      className={`credit-score-display ${className}`}
      data-testid="credit-score-display"
      onClick={handleScoreClick}
    >
      <span className="score">{validScore}</span>
      <span className="date">{date}</span>
    </div>
  );
};
```

### Error Handling Standards

```typescript
// Custom error classes for domain-specific errors
export class FCRAViolationError extends Error {
  constructor(
    message: string,
    public violationType: string
  ) {
    super(message);
    this.name = 'FCRAViolationError';
  }
}

// Async function error handling
async function fetchCreditReport(ssn: string): Promise<CreditReport> {
  try {
    // Validate input
    if (!validateSSN(ssn)) {
      throw new FCRAViolationError('Invalid SSN format', 'INVALID_INPUT');
    }

    // Make API call with timeout
    const response = await axios.get(`/api/credit-report/${ssn}`, {
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    // Log error for debugging (mask PII)
    console.error('Credit report fetch failed:', {
      error: error.message,
      ssn: ssn.replace(/\d(?=\d{4})/g, '*'), // Mask SSN in logs
    });

    // Throw user-friendly error
    throw new Error('Unable to retrieve credit report. Please try again.');
  }
}
```

## PHP/Laravel Standards

### Class Organization

```php
<?php

namespace App\Services;

use App\Models\CreditReport;
use App\Exceptions\FCRAViolationException;
use Illuminate\Support\Facades\Log;

class CreditReportService
{
    // Properties first (visibility order: public, protected, private)
    private $auditService;
    protected $encryptionKey;

    // Constructor
    public function __construct(AuditService $auditService)
    {
        $this->auditService = $auditService;
        $this->encryptionKey = config('app.encryption_key');
    }

    // Public methods first, then protected, then private
    public function generateReport(string $ssn, string $purpose): CreditReport
    {
        // Validate FCRA permissible purpose
        $this->validatePermissiblePurpose($purpose);

        // Create audit trail
        $this->auditService->logCreditAccess($ssn, $purpose);

        // Generate report
        return $this->createCreditReport($ssn);
    }

    private function validatePermissiblePurpose(string $purpose): void
    {
        $validPurposes = ['credit_application', 'account_review', 'collection'];

        if (!in_array($purpose, $validPurposes)) {
            throw new FCRAViolationException("Invalid permissible purpose: {$purpose}");
        }
    }
}
```

### Database Standards

```php
// Use specific column types and constraints
Schema::create('credit_reports', function (Blueprint $table) {
    $table->id();
    $table->string('encrypted_ssn', 255)->index(); // Encrypted PII
    $table->decimal('credit_score', 3, 0)->nullable(); // FICO range 300-850
    $table->json('trade_lines')->nullable();
    $table->timestamp('report_date');
    $table->string('permissible_purpose', 50);
    $table->uuid('audit_trail_id');
    $table->timestamps();

    // Indexes for performance
    $table->index(['encrypted_ssn', 'report_date']);
    $table->index('audit_trail_id');
});
```

## Testing Standards

### Test Structure

```typescript
describe('CreditScoreCalculation', () => {
  // Group related tests
  describe('FICO Score Calculation', () => {
    it('should calculate correct FICO score with valid data', () => {
      // Arrange
      const creditData = {
        paymentHistory: 35, // 35% weight
        creditUtilization: 20, // 30% weight
        lengthOfHistory: 10, // 15% weight
        creditMix: 5, // 10% weight
        newCredit: 5, // 10% weight
      };

      // Act
      const score = calculateFICOScore(creditData);

      // Assert
      expect(score).toBeGreaterThanOrEqual(300);
      expect(score).toBeLessThanOrEqual(850);
      expect(score).toEqual(672); // Expected calculated score
    });

    it('should enforce FICO score boundaries', () => {
      // Test edge cases
      expect(calculateFICOScore(extremelyBadCredit)).toEqual(300);
      expect(calculateFICOScore(perfectCredit)).toEqual(850);
    });
  });
});
```

### Mock Data Standards

```typescript
// Create realistic test data
export const mockCreditReport = {
  ssn: '***-**-1234', // Masked for testing
  score: 720,
  reportDate: '2025-08-07',
  tradeLines: [
    {
      creditor: 'Test Bank',
      accountType: 'Credit Card',
      balance: 1500,
      creditLimit: 5000,
      paymentHistory: 'Current',
    },
  ],
  permissiblePurpose: 'credit_application',
  auditTrail: {
    userId: 'test-user-123',
    timestamp: '2025-08-07T10:00:00Z',
    purpose: 'automated_testing',
  },
};
```

## API Security Standards

### PII Data Handling in APIs

```typescript
// Always validate and sanitize API inputs
app.post('/api/credit-applications', [
  body('ssn').isLength({ min: 11, max: 11 }).custom(validateSSNFormat),
  body('purpose').isIn(['credit_application', 'account_review', 'employment']),
  authenticate,
  authorize('credit_application_submission')
], async (req: Request, res: Response) => {
  try {
    // Validate FCRA permissible purpose
    await validatePermissiblePurpose(req.body.purpose, req.user);

    // Create audit trail BEFORE processing
    const auditId = await auditService.logCreditAccess({
      userId: req.user.id,
      consumerId: req.body.consumerId,
      purpose: req.body.purpose,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Process request with encrypted data
    const result = await creditService.processApplication({
      ...req.body,
      auditId
    });

    res.json(result);
  } catch (error) {
    // Log errors without exposing PII
    logger.error('Credit application failed', {
      auditId,
      userId: req.user.id,
      error: maskPIIInLogs(error.message)
    });

    res.status(500).json({
      error: 'SERVICE_ERROR',
      message: 'Unable to process credit application',
      code: 'CREDIT_APPLICATION_FAILED',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});
```

## Security Standards

### PII Data Handling

```typescript
// Always encrypt PII data
function encryptSSN(ssn: string): string {
  return crypto.encrypt(ssn, process.env.ENCRYPTION_KEY);
}

// Mask PII in logs and displays
function maskSSN(ssn: string): string {
  return ssn.replace(/\d(?=\d{4})/g, '*');
}

// Validate before processing
function validateSSN(ssn: string): boolean {
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  return ssnRegex.test(ssn);
}
```

### API Security

```typescript
// Always validate and sanitize inputs
app.post(
  '/api/credit-report',
  [
    body('ssn').isLength({ min: 11, max: 11 }).escape(),
    body('purpose').isIn(['credit_application', 'account_review']),
    authenticate,
    authorize('credit_access'),
  ],
  async (req: Request, res: Response) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Process request
  }
);
```

## Documentation Standards

### Function Documentation

````typescript
/**
 * Calculates FICO credit score based on credit bureau data
 *
 * @param creditData - Complete credit profile data
 * @param scoreModel - FICO model version (default: 'FICO8')
 * @returns Calculated FICO score (300-850 range)
 *
 * @throws {FCRAViolationError} When credit data access violates FCRA
 * @throws {ValidationError} When input data is invalid
 *
 * @example
 * ```typescript
 * const score = calculateFICOScore({
 *   paymentHistory: 35,
 *   creditUtilization: 20,
 *   lengthOfHistory: 10,
 *   creditMix: 5,
 *   newCredit: 5
 * });
 * console.log(score); // 672
 * ```
 */
function calculateFICOScore(
  creditData: CreditData,
  scoreModel = 'FICO8'
): number {
  // Implementation
}
````

### Git Commit Standards

```bash
# Use conventional commit format
feat(credit-calc): add FICO 8 score calculation with boundary validation
fix(api): resolve PII encryption issue in credit report endpoint
docs(readme): update installation instructions for v3.2.0
test(e2e): add comprehensive credit dispute workflow tests
chore(deps): update TypeScript to v5.3.0
```

These coding standards ensure consistency, maintainability, security, and regulatory compliance across The Credit Pros AI-SDLC framework.
