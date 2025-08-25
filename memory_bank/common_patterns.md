# Common Patterns - The Credit Pros AI-SDLC Framework

## React Component Patterns

### 1. Credit Score Display Component

Standard pattern for displaying credit scores with validation and accessibility:

```typescript
interface CreditScoreProps {
  score: number;
  date: string;
  isLoading?: boolean;
  onScoreClick?: (score: number) => void;
  className?: string;
  showTooltip?: boolean;
}

export const CreditScore: React.FC<CreditScoreProps> = ({
  score,
  date,
  isLoading = false,
  onScoreClick,
  className = '',
  showTooltip = true
}) => {
  // Validate FICO score range (300-850)
  const validScore = Math.min(Math.max(score, 300), 850);
  const scoreRange = getScoreRange(validScore);

  // Accessibility and interaction handlers
  const handleClick = () => onScoreClick?.(validScore);
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onScoreClick?.(validScore);
    }
  };

  if (isLoading) {
    return <CreditScoreSkeleton className={className} />;
  }

  return (
    <div
      className={`credit-score ${scoreRange.toLowerCase()} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onScoreClick ? 0 : -1}
      role={onScoreClick ? 'button' : 'text'}
      aria-label={`Credit score ${validScore}, ${scoreRange} range`}
      data-testid="credit-score-display"
    >
      <span className="score-value">{validScore}</span>
      <span className="score-date">{formatDate(date)}</span>
      {showTooltip && (
        <Tooltip content={`Score updated on ${formatDate(date)}`} />
      )}
    </div>
  );
};

// Helper function for score categorization
function getScoreRange(score: number): string {
  if (score >= 800) return 'EXCELLENT';
  if (score >= 740) return 'VERY_GOOD';
  if (score >= 670) return 'GOOD';
  if (score >= 580) return 'FAIR';
  return 'POOR';
}
```

### 2. Form Validation Pattern

Standard validation pattern for forms with PII data:

```typescript
interface CreditApplicationForm {
  personalInfo: PersonalInfo;
  employment: EmploymentInfo;
  income: IncomeInfo;
}

export const CreditApplicationFormComponent: React.FC = () => {
  const [formData, setFormData] = useState<CreditApplicationForm>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation schema
  const validationSchema = {
    personalInfo: {
      ssn: (value: string) => validateSSN(value) || 'Invalid SSN format',
      dateOfBirth: (value: string) => validateAge(value) || 'Must be 18 or older',
      email: (value: string) => validateEmail(value) || 'Invalid email format'
    },
    employment: {
      employer: (value: string) => value.length > 0 || 'Employer is required',
      income: (value: number) => value > 0 || 'Income must be greater than 0'
    }
  };

  // Real-time validation
  const validateField = (field: string, value: any) => {
    const validator = getValidator(field);
    const error = validator ? validator(value) : null;

    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    return !error;
  };

  // FCRA-compliant form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const isValid = validateAllFields(formData, validationSchema);
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      // Log permissible purpose for FCRA compliance
      await auditLog.record({
        action: 'credit_application_submitted',
        userId: getCurrentUser().id,
        permissiblePurpose: 'credit_application',
        timestamp: new Date().toISOString()
      });

      // Submit application
      await submitCreditApplication(formData);

      // Success handling
      showSuccessMessage('Application submitted successfully');

    } catch (error) {
      // Error handling with user-friendly messages
      const userMessage = error instanceof FCRAViolationError
        ? 'Unable to process application due to compliance requirements'
        : 'An error occurred. Please try again.';

      showErrorMessage(userMessage);

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="credit-application-form">
      <PersonalInfoSection
        data={formData.personalInfo}
        errors={errors}
        onChange={(field, value) => {
          setFormData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, [field]: value }
          }));
          validateField(`personalInfo.${field}`, value);
        }}
      />
      {/* Additional form sections */}

      <button
        type="submit"
        disabled={isSubmitting || hasErrors(errors)}
        className="submit-button"
        data-testid="submit-application"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );
};
```

## API Quality Gate Patterns

### 1. API Documentation Validation Pattern

Standard pattern for validating API documentation completeness:

```typescript
interface OpenAPIValidationConfig {
  requiredFields: string[];
  minLengthRequirements: {
    endpointDescriptions: number;
    parameterDescriptions: number;
    responseDescriptions: number;
  };
  formatRequirements: {
    openapiVersion: string;
    infoRequired: boolean;
    pathsRequired: boolean;
  };
}

export class APIDocumentationValidator {
  private config: OpenAPIValidationConfig;

  constructor(config: OpenAPIValidationConfig = {
    requiredFields: ['openapi', 'info', 'paths'],
    minLengthRequirements: {
      endpointDescriptions: 50,
      parameterDescriptions: 30,
      responseDescriptions: 40
    },
    formatRequirements: {
      openapiVersion: '3.0.0',
      infoRequired: true,
      pathsRequired: true
    }
  }) {
    this.config = config;
  }

  async validateDocumentation(specPath: string): Promise<ValidationResult> {
    try {
      const spec = await this.loadOpenAPISpec(specPath);
      const results: ValidationError[] = [];

      // Validate basic structure
      results.push(...this.validateBasicStructure(spec));

      // Validate endpoint descriptions
      results.push(...this.validateEndpointDescriptions(spec.paths));

      // Validate parameter documentation
      results.push(...this.validateParameterDocumentation(spec.paths));

      // Validate response schemas
      results.push(...this.validateResponseSchemas(spec.paths));

      return {
        valid: results.length === 0,
        errors: results,
        score: this.calculateDocumentationScore(results.length, spec)
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: `Failed to load spec: ${error.message}`, severity: 'critical' }],
        score: 0
      };
    }
  }

  private validateEndpointDescriptions(paths: any): ValidationError[] {
    const errors: ValidationError[] = [];

    Object.entries(paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, endpoint]) => {
        if (endpoint.description?.length < this.config.minLengthRequirements.endpointDescriptions) {
          errors.push({
            message: `Endpoint ${method.toUpperCase()} ${path} description too short`,
            severity: 'medium',
            location: `${path}.${method}.description`
          });
        }
      });
    });

    return errors;
  }
}
```

### 2. Error Response Validation Pattern

Standard pattern for validating consistent error handling:

```typescript
interface ErrorValidationConfig {
  requiredFields: string[];
  sensitiveDataPatterns: RegExp[];
  statusCodes: Record<string, number[]>;
}

export class APIErrorValidator {
  private config: ErrorValidationConfig;

  constructor(config: ErrorValidationConfig = {
    requiredFields: ['error', 'message', 'code', 'timestamp'],
    sensitiveDataPatterns: [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{16}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
    ],
    statusCodes: {
      validation: [400],
      authentication: [401],
      authorization: [403],
      notFound: [404],
      server: [500, 502, 503, 504]
    }
  }) {
    this.config = config;
  }

  validateErrorResponse(response: any, expectedType: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate required fields
    this.config.requiredFields.forEach(field => {
      if (!response.hasOwnProperty(field)) {
        errors.push({
          message: `Missing required field: ${field}`,
          severity: 'high'
        });
      }
    });

    // Validate no sensitive data exposure
    const responseString = JSON.stringify(response);
    this.config.sensitiveDataPatterns.forEach(pattern => {
      if (pattern.test(responseString)) {
        errors.push({
          message: 'Sensitive data detected in error response',
          severity: 'critical'
        });
      }
    });

    // Validate status code mapping
    const expectedCodes = this.config.statusCodes[expectedType] || [];
    if (expectedCodes.length > 0 && !expectedCodes.includes(response.status)) {
      errors.push({
        message: `Unexpected status code ${response.status} for ${expectedType} error`,
        severity: 'medium'
      });
    }

    return errors;
  }
}

## Laravel API Patterns

### 1. Credit Report Controller Pattern

Standard pattern for handling credit report requests with compliance:

```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\CreditReportService;
use App\Services\AuditService;
use App\Http\Requests\CreditReportRequest;
use Illuminate\Http\JsonResponse;
use App\Exceptions\FCRAViolationException;

class CreditReportController extends Controller
{
    public function __construct(
        private CreditReportService $creditReportService,
        private AuditService $auditService
    ) {
        // Middleware for authentication and authorization
        $this->middleware(['auth:sanctum', 'verified']);
        $this->middleware('can:access-credit-reports');
    }

    public function show(CreditReportRequest $request, string $consumerId): JsonResponse
    {
        try {
            // Validate permissible purpose (FCRA Section 604)
            $this->validatePermissiblePurpose(
                $request->permissible_purpose,
                auth()->user()
            );

            // Create audit trail before access
            $auditId = $this->auditService->logCreditAccess([
                'user_id' => auth()->id(),
                'consumer_id' => $consumerId,
                'permissible_purpose' => $request->permissible_purpose,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            // Retrieve credit report
            $creditReport = $this->creditReportService->getCreditReport(
                $consumerId,
                $request->permissible_purpose,
                $auditId
            );

            // Return structured response
            return response()->json([
                'data' => $creditReport,
                'meta' => [
                    'audit_id' => $auditId,
                    'retrieved_at' => now()->toISOString(),
                    'compliance_validated' => true
                ]
            ]);

        } catch (FCRAViolationException $e) {
            // Log compliance violation
            $this->auditService->logViolation([
                'type' => 'fcra_violation',
                'user_id' => auth()->id(),
                'violation' => $e->getMessage(),
                'severity' => 'high'
            ]);

            return response()->json([
                'error' => 'Access denied due to compliance requirements',
                'code' => 'FCRA_VIOLATION'
            ], 403);

        } catch (\Exception $e) {
            // Log general errors (mask PII)
            logger()->error('Credit report access failed', [
                'user_id' => auth()->id(),
                'consumer_id' => hash('sha256', $consumerId), // Hash for privacy
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Unable to retrieve credit report',
                'code' => 'SERVICE_ERROR'
            ], 500);
        }
    }

    private function validatePermissiblePurpose(string $purpose, User $user): void
    {
        $validPurposes = [
            'credit_application',
            'account_review',
            'employment',
            'insurance'
        ];

        if (!in_array($purpose, $validPurposes)) {
            throw new FCRAViolationException("Invalid permissible purpose: {$purpose}");
        }

        // Check user permissions for specific purpose
        if (!$user->can('access-credit-reports-for-' . $purpose)) {
            throw new FCRAViolationException("User lacks permission for purpose: {$purpose}");
        }
    }
}
```

### 2. Service Layer Pattern

Standard pattern for business logic with error handling:

```php
<?php

namespace App\Services;

use App\Models\CreditReport;
use App\Exceptions\FCRAViolationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CreditReportService
{
    public function __construct(
        private CreditBureauService $creditBureauService,
        private EncryptionService $encryptionService,
        private AuditService $auditService
    ) {}

    public function getCreditReport(
        string $consumerId,
        string $permissiblePurpose,
        string $auditId
    ): CreditReport {
        // Check cache first (with encryption)
        $cacheKey = "credit_report:{$consumerId}";

        if ($cached = Cache::get($cacheKey)) {
            $decryptedData = $this->encryptionService->decrypt($cached);
            return CreditReport::fromArray($decryptedData);
        }

        try {
            // Fetch from credit bureau with retry logic
            $rawData = $this->fetchFromBureauWithRetry(
                $consumerId,
                $permissiblePurpose,
                $auditId
            );

            // Process and normalize data
            $creditReport = $this->processRawCreditData($rawData);

            // Cache encrypted data (for 1 hour)
            $encryptedData = $this->encryptionService->encrypt($creditReport->toArray());
            Cache::put($cacheKey, $encryptedData, 3600);

            return $creditReport;

        } catch (\Exception $e) {
            // Log error with audit trail
            $this->auditService->logError([
                'audit_id' => $auditId,
                'error_type' => 'credit_report_fetch_failed',
                'error_message' => $e->getMessage(),
                'consumer_id' => hash('sha256', $consumerId)
            ]);

            throw $e;
        }
    }

    private function fetchFromBureauWithRetry(
        string $consumerId,
        string $permissiblePurpose,
        string $auditId,
        int $maxAttempts = 3
    ): array {
        $attempt = 1;

        while ($attempt <= $maxAttempts) {
            try {
                return $this->creditBureauService->fetchReport(
                    $consumerId,
                    $permissiblePurpose
                );

            } catch (BureauTimeoutException $e) {
                if ($attempt === $maxAttempts) {
                    throw new \Exception('Credit bureau service unavailable after retries');
                }

                // Exponential backoff
                sleep(pow(2, $attempt));
                $attempt++;

            } catch (BureauRateLimitException $e) {
                // Log rate limit hit
                Log::warning('Bureau rate limit exceeded', [
                    'audit_id' => $auditId,
                    'attempt' => $attempt
                ]);

                // Wait and retry
                sleep(60); // Wait 1 minute for rate limit reset
                $attempt++;
            }
        }
    }
}
```

## Testing Patterns

### 1. Component Test Pattern

Standard pattern for testing React components:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CreditScore } from '../CreditScore';

describe('CreditScore Component', () => {
  const defaultProps = {
    score: 720,
    date: '2025-08-07',
    onScoreClick: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display credit score within valid range', () => {
    render(<CreditScore {...defaultProps} />);

    const scoreElement = screen.getByTestId('credit-score-display');
    expect(scoreElement).toBeInTheDocument();
    expect(screen.getByText('720')).toBeInTheDocument();
  });

  it('should enforce FICO score boundaries', () => {
    // Test minimum boundary
    render(<CreditScore {...defaultProps} score={200} />);
    expect(screen.getByText('300')).toBeInTheDocument();

    // Test maximum boundary
    render(<CreditScore {...defaultProps} score={900} />);
    expect(screen.getByText('850')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<CreditScore {...defaultProps} />);

    const scoreElement = screen.getByTestId('credit-score-display');
    await user.click(scoreElement);

    expect(defaultProps.onScoreClick).toHaveBeenCalledWith(720);
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<CreditScore {...defaultProps} />);

    const scoreElement = screen.getByTestId('credit-score-display');
    await user.tab();
    expect(scoreElement).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(defaultProps.onScoreClick).toHaveBeenCalledWith(720);
  });

  it('should show loading state', () => {
    render(<CreditScore {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId('credit-score-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('720')).not.toBeInTheDocument();
  });
});
```

### 2. API Test Pattern

Standard pattern for testing Laravel API endpoints:

```php
<?php

namespace Tests\Feature\API;

use Tests\TestCase;
use App\Models\User;
use App\Models\Consumer;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CreditReportControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Consumer $consumer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->consumer = Consumer::factory()->create();

        // Grant necessary permissions
        $this->user->givePermissionTo('access-credit-reports');
    }

    /** @test */
    public function it_returns_credit_report_with_valid_permissible_purpose()
    {
        $this->actingAs($this->user);

        $response = $this->getJson("/api/credit-reports/{$this->consumer->id}", [
            'permissible_purpose' => 'credit_application'
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'score',
                        'report_date',
                        'trade_lines'
                    ],
                    'meta' => [
                        'audit_id',
                        'retrieved_at',
                        'compliance_validated'
                    ]
                ]);
    }

    /** @test */
    public function it_rejects_invalid_permissible_purpose()
    {
        $this->actingAs($this->user);

        $response = $this->getJson("/api/credit-reports/{$this->consumer->id}", [
            'permissible_purpose' => 'curiosity'
        ]);

        $response->assertStatus(403)
                ->assertJson([
                    'error' => 'Access denied due to compliance requirements',
                    'code' => 'FCRA_VIOLATION'
                ]);
    }

    /** @test */
    public function it_creates_audit_trail_for_credit_access()
    {
        $this->actingAs($this->user);

        $this->getJson("/api/credit-reports/{$this->consumer->id}", [
            'permissible_purpose' => 'credit_application'
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'credit_report_access',
            'user_id' => $this->user->id,
            'consumer_id' => $this->consumer->id,
            'permissible_purpose' => 'credit_application'
        ]);
    }

    /** @test */
    public function it_requires_authentication()
    {
        $response = $this->getJson("/api/credit-reports/{$this->consumer->id}");

        $response->assertStatus(401);
    }

    /** @test */
    public function it_enforces_authorization()
    {
        $unauthorizedUser = User::factory()->create();
        $this->actingAs($unauthorizedUser);

        $response = $this->getJson("/api/credit-reports/{$this->consumer->id}", [
            'permissible_purpose' => 'credit_application'
        ]);

        $response->assertStatus(403);
    }
}
```

### 3. E2E Test Pattern

Standard pattern for Playwright E2E tests:

```typescript
import { test, expect } from '@playwright/test';
import { CreditDisputePage } from '../pages/CreditDisputePage';
import { LoginPage } from '../pages/LoginPage';

test.describe('Credit Dispute Workflow', () => {
  let loginPage: LoginPage;
  let disputePage: CreditDisputePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    disputePage = new CreditDisputePage(page);

    // Login with test user
    await loginPage.login('test@thecreditpros.com', 'password123');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should complete credit dispute submission process', async ({
    page,
  }) => {
    // Navigate to dispute page
    await disputePage.navigate();
    await expect(
      page.locator('[data-testid="dispute-dashboard"]')
    ).toBeVisible();

    // Load credit report
    await disputePage.loadCreditReport();
    await expect(
      page.locator('[data-testid="credit-report-loaded"]')
    ).toBeVisible();

    // Select dispute items
    await disputePage.selectDisputeItem('Incorrect payment history');
    await disputePage.selectDisputeReason('Never late on payments');

    // Upload supporting documents
    await disputePage.uploadDocument('./test-files/bank-statement.pdf');
    await expect(
      page.locator('[data-testid="document-uploaded"]')
    ).toBeVisible();

    // Submit dispute
    await disputePage.submitDispute();

    // Verify confirmation
    await expect(
      page.locator('[data-testid="dispute-confirmation"]')
    ).toBeVisible();
    await expect(
      page.locator('text=Your dispute has been submitted')
    ).toBeVisible();

    // Verify audit trail (check network request)
    const auditRequest = page.waitForRequest(
      (req) => req.url().includes('/api/audit-logs') && req.method() === 'POST'
    );

    expect(auditRequest).toBeTruthy();
  });

  test('should handle dispute form validation', async ({ page }) => {
    await disputePage.navigate();
    await disputePage.loadCreditReport();

    // Attempt to submit without required fields
    await disputePage.submitDispute();

    // Check for validation errors
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('text=Please select at least one item to dispute')
    ).toBeVisible();
  });

  test('should track dispute status', async ({ page }) => {
    // Submit a dispute first
    await disputePage.navigate();
    await disputePage.loadCreditReport();
    await disputePage.selectDisputeItem('Incorrect balance');
    await disputePage.submitDispute();

    // Navigate to dispute tracking
    await page.click('[data-testid="track-disputes"]');

    // Verify dispute appears in tracking
    await expect(page.locator('[data-testid="dispute-status"]')).toContainText(
      'Under Investigation'
    );
    await expect(
      page.locator('[data-testid="dispute-deadline"]')
    ).toBeVisible();
  });
});
```

These common patterns provide consistent, tested, and compliant code structures for The Credit Pros AI-SDLC framework development.
