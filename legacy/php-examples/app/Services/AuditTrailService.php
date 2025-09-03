<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuditTrailService
{
    /**
     * Log credit data access for FCRA compliance
     */
    public function logCreditAccess(array $data): string
    {
        $auditId = Str::uuid();
        
        DB::table("audit_logs")->insert([
            "id" => $auditId,
            "action" => "credit_report_access",
            "user_id" => $data["user_id"],
            "consumer_id" => hash("sha256", $data["consumer_id"]), // Hash for privacy
            "permissible_purpose" => $data["permissible_purpose"],
            "ip_address" => $data["ip_address"],
            "user_agent" => $data["user_agent"],
            "compliance_flags" => json_encode(["FCRA_SECTION_604", "PII_ACCESS"]),
            "created_at" => now(),
            "updated_at" => now()
        ]);
        
        Log::info("Credit access logged", [
            "audit_id" => $auditId,
            "action" => "credit_report_access",
            "user_id" => $data["user_id"],
            "purpose" => $data["permissible_purpose"]
        ]);
        
        return $auditId;
    }

    /**
     * Log credit calculation for FCRA compliance
     */
    public function logCreditCalculation(array $data): void
    {
        DB::table("audit_logs")->insert([
            "id" => Str::uuid(),
            "action" => $data["action"],
            "audit_id" => $data["audit_id"],
            "permissible_purpose" => $data["permissible_purpose"] ?? null,
            "input_hash" => $data["input_hash"] ?? null,
            "result" => $data["result"] ?? null,
            "calculation_method" => $data["calculation_method"] ?? null,
            "compliance_flags" => json_encode(["FCRA_CALCULATION", "FICO_VALIDATION"]),
            "created_at" => $data["timestamp"],
            "updated_at" => $data["timestamp"]
        ]);
    }

    /**
     * Log FCRA compliance violations
     */
    public function logViolation(array $data): void
    {
        $violationId = Str::uuid();
        
        DB::table("compliance_violations")->insert([
            "id" => $violationId,
            "type" => $data["type"],
            "user_id" => $data["user_id"],
            "violation" => $data["violation"],
            "severity" => $data["severity"],
            "compliance_flags" => json_encode(["FCRA_VIOLATION", "IMMEDIATE_ATTENTION"]),
            "created_at" => now(),
            "updated_at" => now()
        ]);
        
        // Log critical violations immediately
        Log::critical("FCRA compliance violation", [
            "violation_id" => $violationId,
            "type" => $data["type"],
            "user_id" => $data["user_id"],
            "violation" => $data["violation"],
            "severity" => $data["severity"]
        ]);
    }

    /**
     * Log general errors with audit context
     */
    public function logError(array $data): void
    {
        DB::table("audit_logs")->insert([
            "id" => Str::uuid(),
            "action" => "error_occurred",
            "audit_id" => $data["audit_id"],
            "error_type" => $data["error_type"],
            "error_message" => $data["error_message"],
            "compliance_flags" => json_encode(["ERROR_TRACKING"]),
            "created_at" => $data["timestamp"],
            "updated_at" => $data["timestamp"]
        ]);
    }
}
