// TODO: Add audit trail logging for FCRA compliance
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\CreditReportService;
use App\Services\AuditTrailService;
use App\Http\Requests\CreditReportRequest;
use Illuminate\Http\JsonResponse;
use App\Exceptions\FCRAViolationException;

class CreditReportController extends Controller
{
    public function __construct(
        private CreditReportService $creditReportService,
        private AuditTrailService $auditService
    ) {
        $this->middleware(["auth:sanctum", "verified"]);
        $this->middleware("can:access-credit-reports");
    }

    /**
     * Retrieve credit report with FCRA compliance validation
     */
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
                "user_id" => auth()->id(),
                "consumer_id" => $consumerId,
                "permissible_purpose" => $request->permissible_purpose,
                "ip_address" => $request->ip(),
                "user_agent" => $request->userAgent()
            ]);

            // Retrieve credit report
            $creditReport = $this->creditReportService->getCreditReport(
                $consumerId,
                $request->permissible_purpose,
                $auditId
            );

            return response()->json([
                "data" => $creditReport,
                "meta" => [
                    "audit_id" => $auditId,
                    "retrieved_at" => now()->toISOString(),
                    "compliance_validated" => true
                ]
            ]);

        } catch (FCRAViolationException $e) {
            // Log compliance violation
            $this->auditService->logViolation([
                "type" => "fcra_violation",
                "user_id" => auth()->id(),
                "violation" => $e->getMessage(),
                "severity" => "high"
            ]);

            return response()->json([
                "error" => "Access denied due to compliance requirements",
                "code" => "FCRA_VIOLATION"
            ], 403);

        } catch (\Exception $e) {
            // Log general errors (mask PII)
            logger()->error("Credit report access failed", [
                "user_id" => auth()->id(),
                "consumer_id" => hash("sha256", $consumerId),
                "error" => $e->getMessage()
            ]);

            return response()->json([
                "error" => "Unable to retrieve credit report",
                "code" => "SERVICE_ERROR"
            ], 500);
        }
    }

    private function validatePermissiblePurpose(string $purpose, $user): void
    {
        $validPurposes = [
            "credit_application",
            "account_review",
            "employment",
            "insurance"
        ];

        if (!in_array($purpose, $validPurposes)) {
            throw new FCRAViolationException("Invalid permissible purpose: {$purpose}");
        }

        if (!$user->can("access-credit-reports-for-" . $purpose)) {
            throw new FCRAViolationException("User lacks permission for purpose: {$purpose}");
        }
    }
}
