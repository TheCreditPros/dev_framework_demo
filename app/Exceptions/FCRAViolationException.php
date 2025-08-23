<?php

namespace App\Exceptions;

use Exception;

class FCRAViolationException extends Exception
{
    public function __construct(
        string $message,
        public readonly string $violationType = "GENERAL_VIOLATION",
        int $code = 403,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Get user-friendly error message for FCRA violations
     */
    public function getUserMessage(): string
    {
        return "Access denied due to compliance requirements. Please contact your administrator.";
    }

    /**
     * Get compliance flags for audit logging
     */
    public function getComplianceFlags(): array
    {
        return [
            "FCRA_VIOLATION",
            "SECTION_604_VIOLATION", 
            "IMMEDIATE_ATTENTION_REQUIRED"
        ];
    }
}
