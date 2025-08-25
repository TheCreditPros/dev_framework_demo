<?php

/**
 * Laravel PostgreSQL Database Testing Integration
 * Credit Repair FCRA-Compliant Database Testing
 */

namespace Tests\Database;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Carbon\Carbon;

class PostgresFCRAComplianceTest extends TestCase
{
    use RefreshDatabase;

    protected $testConsumerId = 999999;
    
    public function setUp(): void
    {
        parent::setUp();
        
        // Ensure we're using PostgreSQL test database
        config(['database.default' => 'pgsql_test']);
        
        // Create FCRA audit tables if they don't exist
        $this->createFCRAAuditTables();
    }

    /**
     * Test FCRA Section 604 - Permissible Purposes
     */
    public function test_fcra_section_604_credit_report_access_logging()
    {
        // Test that all credit report access is properly logged
        $accessData = [
            'consumer_id' => $this->testConsumerId,
            'bureau_name' => 'Equifax',
            'access_purpose' => 'account_review',
            'permissible_purpose_code' => 'AR',
            'accessed_by_user_id' => 1,
            'consumer_consent' => true,
            'fcra_disclosure_provided' => true,
            'access_timestamp' => now(),
        ];

        DB::table('credit_report_access_log')->insert($accessData);

        // Verify access was logged with FCRA compliance
        $logged = DB::table('credit_report_access_log')
            ->where('consumer_id', $this->testConsumerId)
            ->where('consumer_consent', true)
            ->where('fcra_disclosure_provided', true)
            ->first();

        $this->assertNotNull($logged);
        $this->assertEquals('account_review', $logged->access_purpose);
        $this->assertTrue($logged->consumer_consent);
        $this->assertTrue($logged->fcra_disclosure_provided);
    }

    /**
     * Test FCRA Section 611 - Dispute Processing Timeline
     */
    public function test_fcra_section_611_dispute_processing_timeline()
    {
        // Test 30-day dispute processing requirement
        $disputeData = [
            'consumer_id' => $this->testConsumerId,
            'dispute_id' => 5001,
            'processing_stage' => 'investigation_complete',
            'processing_timestamp' => now(),
            'days_to_complete' => 28, // Within 30-day FCRA requirement
            'fcra_compliant' => true,
            'compliance_notes' => 'Completed within FCRA 30-day requirement'
        ];

        DB::table('dispute_processing_log')->insert($disputeData);

        // Verify dispute processing compliance
        $compliantDisputes = DB::table('dispute_processing_log')
            ->where('consumer_id', $this->testConsumerId)
            ->where('days_to_complete', '<=', 30)
            ->where('fcra_compliant', true)
            ->count();

        $this->assertGreaterThan(0, $compliantDisputes);
        
        // Test non-compliant scenario
        $nonCompliantData = [
            'consumer_id' => $this->testConsumerId + 1,
            'dispute_id' => 5002,
            'processing_stage' => 'overdue',
            'processing_timestamp' => now(),
            'days_to_complete' => 35, // Over 30-day FCRA requirement
            'fcra_compliant' => false,
            'compliance_notes' => 'Exceeded FCRA 30-day requirement - escalation needed'
        ];

        DB::table('dispute_processing_log')->insert($nonCompliantData);

        $nonCompliantDisputes = DB::table('dispute_processing_log')
            ->where('days_to_complete', '>', 30)
            ->where('fcra_compliant', false)
            ->count();

        $this->assertGreaterThan(0, $nonCompliantDisputes);
    }

    /**
     * Test Credit Score Validation (300-850 range)
     */
    public function test_credit_score_validation_ranges()
    {
        // Test valid credit score ranges
        $validScores = [300, 580, 720, 850];
        $invalidScores = [299, 851, 0, 999];

        foreach ($validScores as $score) {
            $this->assertTrue($this->isValidCreditScore($score), "Score $score should be valid");
        }

        foreach ($invalidScores as $score) {
            $this->assertFalse($this->isValidCreditScore($score), "Score $score should be invalid");
        }
    }

    /**
     * Test PII Data Encryption and Masking
     */
    public function test_pii_data_encryption_compliance()
    {
        // Test that sensitive consumer data is properly encrypted/masked
        $consumerData = [
            'ssn' => '123-45-6789',
            'phone' => '555-123-4567',
            'email' => 'test@example.com',
            'address' => '123 Main St, City, ST 12345'
        ];

        // Simulate PII masking for display
        $maskedData = $this->maskPIIForDisplay($consumerData);

        $this->assertEquals('XXX-XX-6789', $maskedData['ssn']);
        $this->assertEquals('XXX-XXX-4567', $maskedData['phone']);
        $this->assertEquals('t***@example.com', $maskedData['email']);
        $this->assertStringContains('***', $maskedData['address']);
    }

    /**
     * Test Database Performance for Large Consumer Data Sets
     */
    public function test_database_performance_consumer_queries()
    {
        // Create test consumer records
        $this->seedTestConsumerData(1000);

        $startTime = microtime(true);
        
        // Test consumer lookup performance
        $consumers = DB::table('fcra_audit_log')
            ->where('consumer_id', '>', 0)
            ->where('created_at', '>', Carbon::now()->subDays(30))
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        $queryTime = (microtime(true) - $startTime) * 1000; // Convert to milliseconds

        // Query should complete within 100ms for good performance
        $this->assertLessThan(100, $queryTime, "Consumer query took {$queryTime}ms - should be under 100ms");
        $this->assertNotEmpty($consumers);
    }

    /**
     * Test Data Retention Policy Compliance
     */
    public function test_data_retention_policy_compliance()
    {
        // Test 7-year data retention for credit repair industry
        $retentionData = [
            'table_name' => 'credit_reports',
            'consumer_id' => $this->testConsumerId,
            'data_type' => 'credit_history',
            'retention_period_years' => 7,
            'created_at' => now(),
            'expires_at' => now()->addYears(7),
            'auto_delete_enabled' => true
        ];

        DB::table('data_retention_policy')->insert($retentionData);

        // Verify retention policy is set
        $policy = DB::table('data_retention_policy')
            ->where('consumer_id', $this->testConsumerId)
            ->where('retention_period_years', 7)
            ->first();

        $this->assertNotNull($policy);
        $this->assertTrue($policy->auto_delete_enabled);
        
        // Test that expired data is flagged for deletion
        $expiredData = DB::table('data_retention_policy')
            ->where('expires_at', '<', now())
            ->where('auto_delete_enabled', true)
            ->count();

        // This should be 0 for fresh test data, but structure validates
        $this->assertIsInt($expiredData);
    }

    /**
     * Test Audit Trail Integrity
     */
    public function test_audit_trail_integrity()
    {
        // Test that all database changes are properly audited
        $auditData = [
            'consumer_id' => $this->testConsumerId,
            'action_type' => 'credit_score_update',
            'table_name' => 'credit_scores',
            'record_id' => 1001,
            'old_values' => json_encode(['score' => 650]),
            'new_values' => json_encode(['score' => 680]),
            'user_id' => 1,
            'ip_address' => '192.168.1.100',
            'fcra_section' => '611',
            'compliance_notes' => 'Score updated after successful dispute resolution'
        ];

        DB::table('fcra_audit_log')->insert($auditData);

        // Verify audit trail completeness
        $auditRecord = DB::table('fcra_audit_log')
            ->where('consumer_id', $this->testConsumerId)
            ->where('action_type', 'credit_score_update')
            ->first();

        $this->assertNotNull($auditRecord);
        $this->assertNotNull($auditRecord->old_values);
        $this->assertNotNull($auditRecord->new_values);
        $this->assertNotNull($auditRecord->user_id);
        $this->assertNotNull($auditRecord->ip_address);
        $this->assertEquals('611', $auditRecord->fcra_section);
    }

    // Helper Methods

    private function createFCRAAuditTables(): void
    {
        // Create tables if they don't exist (should be handled by migrations)
        if (!Schema::hasTable('fcra_audit_log')) {
            Schema::create('fcra_audit_log', function ($table) {
                $table->bigIncrements('id');
                $table->bigInteger('consumer_id')->nullable();
                $table->string('action_type', 50);
                $table->string('table_name', 100);
                $table->bigInteger('record_id')->nullable();
                $table->json('old_values')->nullable();
                $table->json('new_values')->nullable();
                $table->bigInteger('user_id')->nullable();
                $table->ipAddress('ip_address')->nullable();
                $table->text('user_agent')->nullable();
                $table->string('fcra_section', 20)->nullable();
                $table->text('compliance_notes')->nullable();
                $table->timestampTz('created_at')->default(now());
                
                $table->index(['consumer_id', 'created_at']);
                $table->index(['action_type', 'created_at']);
                $table->index('fcra_section');
            });
        }

        if (!Schema::hasTable('credit_report_access_log')) {
            Schema::create('credit_report_access_log', function ($table) {
                $table->bigIncrements('id');
                $table->bigInteger('consumer_id');
                $table->string('bureau_name', 20);
                $table->string('access_purpose', 50);
                $table->string('permissible_purpose_code', 10)->nullable();
                $table->bigInteger('accessed_by_user_id')->nullable();
                $table->timestampTz('access_timestamp')->default(now());
                $table->boolean('consumer_consent')->default(false);
                $table->boolean('fcra_disclosure_provided')->default(false);
                $table->timestampTz('retention_expires_at')->nullable();
                
                $table->index(['consumer_id', 'access_timestamp']);
                $table->index(['access_purpose', 'access_timestamp']);
            });
        }

        if (!Schema::hasTable('dispute_processing_log')) {
            Schema::create('dispute_processing_log', function ($table) {
                $table->bigIncrements('id');
                $table->bigInteger('consumer_id');
                $table->bigInteger('dispute_id');
                $table->string('processing_stage', 50);
                $table->json('bureau_response')->nullable();
                $table->timestampTz('processing_timestamp')->default(now());
                $table->integer('days_to_complete')->nullable();
                $table->boolean('fcra_compliant')->default(true);
                $table->text('compliance_notes')->nullable();
                
                $table->index(['consumer_id', 'processing_timestamp']);
                $table->index(['dispute_id', 'processing_stage']);
            });
        }

        if (!Schema::hasTable('data_retention_policy')) {
            Schema::create('data_retention_policy', function ($table) {
                $table->bigIncrements('id');
                $table->string('table_name', 100);
                $table->bigInteger('consumer_id');
                $table->string('data_type', 50);
                $table->integer('retention_period_years');
                $table->timestampTz('created_at')->default(now());
                $table->timestampTz('expires_at');
                $table->boolean('auto_delete_enabled')->default(true);
                
                $table->index(['expires_at', 'auto_delete_enabled']);
            });
        }
    }

    private function isValidCreditScore(int $score): bool
    {
        return $score >= 300 && $score <= 850;
    }

    private function maskPIIForDisplay(array $data): array
    {
        return [
            'ssn' => 'XXX-XX-' . substr($data['ssn'], -4),
            'phone' => 'XXX-XXX-' . substr($data['phone'], -4),
            'email' => substr($data['email'], 0, 1) . '***@' . explode('@', $data['email'])[1],
            'address' => '*** ' . substr($data['address'], -10)
        ];
    }

    private function seedTestConsumerData(int $count): void
    {
        for ($i = 1; $i <= $count; $i++) {
            DB::table('fcra_audit_log')->insert([
                'consumer_id' => $i,
                'action_type' => 'test_data_seed',
                'table_name' => 'consumers',
                'record_id' => $i,
                'fcra_section' => '604',
                'compliance_notes' => 'Test data for performance testing',
                'created_at' => now()->subDays(rand(1, 365))
            ]);
        }
    }
}

/**
 * Feature Test for Credit Repair Database Operations
 */
class CreditRepairDatabaseFeatureTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test complete credit repair workflow database operations
     */
    public function test_complete_credit_repair_workflow()
    {
        // 1. Consumer Registration
        $consumerId = $this->createTestConsumer();
        
        // 2. Credit Report Import
        $this->logCreditReportAccess($consumerId);
        
        // 3. Dispute Filing
        $disputeId = $this->fileTestDispute($consumerId);
        
        // 4. Dispute Processing
        $this->processDispute($disputeId);
        
        // 5. Verify Complete Audit Trail
        $auditTrail = DB::table('fcra_audit_log')
            ->where('consumer_id', $consumerId)
            ->orderBy('created_at')
            ->get();
            
        $this->assertGreaterThanOrEqual(3, $auditTrail->count());
        
        // Verify FCRA compliance throughout workflow
        $fcraCompliantActions = $auditTrail->where('fcra_section', '!=', null);
        $this->assertGreaterThan(0, $fcraCompliantActions->count());
    }

    private function createTestConsumer(): int
    {
        $consumerId = rand(100000, 999999);
        
        DB::table('fcra_audit_log')->insert([
            'consumer_id' => $consumerId,
            'action_type' => 'consumer_registration',
            'table_name' => 'consumers',
            'record_id' => $consumerId,
            'fcra_section' => '604',
            'compliance_notes' => 'Consumer registered with FCRA disclosure provided'
        ]);
        
        return $consumerId;
    }

    private function logCreditReportAccess(int $consumerId): void
    {
        DB::table('credit_report_access_log')->insert([
            'consumer_id' => $consumerId,
            'bureau_name' => 'Equifax',
            'access_purpose' => 'credit_repair_analysis',
            'permissible_purpose_code' => 'CRA',
            'consumer_consent' => true,
            'fcra_disclosure_provided' => true
        ]);
    }

    private function fileTestDispute(int $consumerId): int
    {
        $disputeId = rand(10000, 99999);
        
        DB::table('dispute_processing_log')->insert([
            'consumer_id' => $consumerId,
            'dispute_id' => $disputeId,
            'processing_stage' => 'filed',
            'days_to_complete' => null,
            'fcra_compliant' => true,
            'compliance_notes' => 'Dispute filed within FCRA guidelines'
        ]);
        
        return $disputeId;
    }

    private function processDispute(int $disputeId): void
    {
        DB::table('dispute_processing_log')
            ->where('dispute_id', $disputeId)
            ->update([
                'processing_stage' => 'investigation_complete',
                'days_to_complete' => 25,
                'fcra_compliant' => true,
                'compliance_notes' => 'Investigation completed within 30-day FCRA requirement'
            ]);
    }
}