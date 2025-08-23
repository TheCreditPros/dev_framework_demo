<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Config;

class EncryptionService
{
    /**
     * Encrypt PII data for FCRA compliance
     */
    public function encrypt(string $data): string
    {
        return Crypt::encrypt($data);
    }

    /**
     * Decrypt PII data
     */
    public function decrypt(string $encryptedData): string
    {
        return Crypt::decrypt($encryptedData);
    }

    /**
     * Mask SSN for display (FCRA compliant)
     */
    public function maskSSN(string $ssn): string
    {
        // Show only last 4 digits: 123-45-6789 → ***-**-6789
        if (strlen($ssn) >= 4) {
            return "***-**-" . substr($ssn, -4);
        }
        return "***-**-****";
    }

    /**
     * Hash sensitive data for audit trails
     */
    public function hashForAudit(string $data): string
    {
        return hash("sha256", $data . Config::get("app.key"));
    }
}
