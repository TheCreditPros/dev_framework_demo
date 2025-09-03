<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - FCRA compliant credit report structure
     */
    public function up(): void
    {
        Schema::create("credit_reports", function (Blueprint $table) {
            $table->id();
            
            // Consumer identification (encrypted for PII protection)
            $table->string("encrypted_consumer_id", 255)->index();
            $table->string("encrypted_ssn", 255)->index(); // Encrypted SSN
            
            // Credit score data
            $table->decimal("credit_score", 3, 0)->nullable(); // FICO range 300-850
            $table->string("score_model", 20)->default("FICO_8");
            $table->timestamp("score_date");
            
            // Credit profile data (JSON for flexibility)
            $table->json("trade_lines")->nullable();
            $table->json("payment_history")->nullable();
            $table->json("credit_inquiries")->nullable();
            $table->json("public_records")->nullable();
            
            // FCRA compliance fields
            $table->string("permissible_purpose", 50);
            $table->uuid("audit_trail_id");
            $table->string("bureau_source", 20); // Experian, Equifax, TransUnion
            $table->timestamp("report_date");
            $table->timestamp("expires_at"); // Data retention compliance
            
            // Metadata
            $table->timestamps();
            $table->softDeletes(); // Soft delete for compliance
            
            // Indexes for performance and compliance queries
            $table->index(["encrypted_consumer_id", "report_date"]);
            $table->index("audit_trail_id");
            $table->index("permissible_purpose");
            $table->index("expires_at");
            $table->index(["bureau_source", "report_date"]);
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::dropIfExists("credit_reports");
    }
};
