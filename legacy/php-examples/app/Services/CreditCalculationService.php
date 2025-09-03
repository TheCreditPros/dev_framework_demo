<?php

namespace App\Services;

use App\Services\AuditTrailService;
use App\Services\EncryptionService;
use App\Exceptions\FCRAViolationException;
use Illuminate\Support\Facades\Log;

class CreditCalculationService
{
    public function __construct(
        private AuditTrailService $auditService,
        private EncryptionService $encryptionService
    ) {}

    /**
     * Calculate FICO credit score with FCRA compliance
     * 
     * @param array $creditData Credit profile data
     * @param string $permissiblePurpose FCRA Section 604 purpose
     * @return int FICO score (300-850 range)
     * @throws FCRAViolationException
     */
    public function calculateFICOScore(
        array $creditData, 
        string $permissiblePurpose,
        string $auditId
    ): int {
        // Validate permissible purpose before calculation
        $this->validatePermissiblePurpose($permissiblePurpose);

        // Create audit trail for credit calculation
        $this->auditService->logCreditCalculation([
            "audit_id" => $auditId,
            "action" => "fico_score_calculation",
            "permissible_purpose" => $permissiblePurpose,
            "input_hash" => hash("sha256", json_encode($creditData)),
            "timestamp" => now()
        ]);

        try {
            // Validate input data
            $this->validateCreditData($creditData);

            // FICO Score calculation with industry-standard weights
            $score = $this->performFICOCalculation($creditData);

            // Enforce FICO score boundaries (300-850)
            $boundedScore = max(300, min(850, $score));

            // Log successful calculation
            $this->auditService->logCreditCalculation([
                "audit_id" => $auditId,
                "action" => "fico_score_calculated",
                "result" => $boundedScore,
                "calculation_method" => "FICO_8",
                "timestamp" => now()
            ]);

            return $boundedScore;

        } catch (\Exception $e) {
            // Log calculation error
            $this->auditService->logError([
                "audit_id" => $auditId,
                "error_type" => "credit_calculation_failed",
                "error_message" => $e->getMessage(),
                "timestamp" => now()
            ]);

            throw $e;
        }
    }

    /**
     * Calculate credit utilization ratio
     */
    public function calculateCreditUtilization(array $accounts): float
    {
        $totalBalance = 0;
        $totalLimit = 0;

        foreach ($accounts as $account) {
            $totalBalance += $account["balance"] ?? 0;
            $totalLimit += $account["credit_limit"] ?? 0;
        }

        if ($totalLimit === 0) {
            return 0.0;
        }

        $utilization = ($totalBalance / $totalLimit) * 100;
        return round($utilization, 2);
    }

    private function performFICOCalculation(array $data): int
    {
        // FICO Score calculation with industry-standard weights
        $paymentHistoryScore = ($data["payment_history"] ?? 0) * 0.35;
        $creditUtilizationScore = ($data["credit_utilization"] ?? 0) * 0.30;
        $lengthOfHistoryScore = ($data["length_of_history"] ?? 0) * 0.15;
        $creditMixScore = ($data["credit_mix"] ?? 0) * 0.10;
        $newCreditScore = ($data["new_credit"] ?? 0) * 0.10;

        $rawScore = $paymentHistoryScore + $creditUtilizationScore + 
                   $lengthOfHistoryScore + $creditMixScore + $newCreditScore;

        // Convert to FICO scale (300-850)
        return (int) round(300 + ($rawScore * 5.5));
    }

    private function validateCreditData(array $data): void
    {
        $requiredFields = [
            "payment_history",
            "credit_utilization", 
            "length_of_history",
            "credit_mix",
            "new_credit"
        ];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new \InvalidArgumentException("Missing required field: {$field}");
            }

            if (!is_numeric($data[$field]) || $data[$field] < 0 || $data[$field] > 100) {
                throw new \InvalidArgumentException("Invalid value for {$field}: must be 0-100");
            }
        }
    }

    private function validatePermissiblePurpose(string $purpose): void
    {
        $validPurposes = [
            "credit_application",
            "account_review",
            "employment",
            "insurance",
            "business_transaction"
        ];

        if (!in_array($purpose, $validPurposes)) {
            throw new FCRAViolationException(
                "Invalid permissible purpose for credit calculation: {$purpose}"
            );
        }
    }
}
