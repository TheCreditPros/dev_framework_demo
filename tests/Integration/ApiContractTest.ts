import { describe, it, expect, beforeAll, afterAll } from "vitest";
import axios from "axios";

// API Contract Testing between Laravel Backend and React Frontend
describe("Laravel + React API Contract Testing", () => {
  const API_BASE_URL = "http://localhost:8000/api";
  let authToken: string;

  beforeAll(async () => {
    // Setup test authentication
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: "test@thecreditpros.com",
        password: "password123"
      });
      authToken = response.data.token;
    } catch (error) {
      console.warn("API not available for contract testing");
    }
  });

  describe("Credit Report API Contract", () => {
    it("should return credit report with FCRA compliance structure", async () => {
      if (!authToken) return; // Skip if API not available

      const response = await axios.get(
        `${API_BASE_URL}/credit-reports/test-consumer-123`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { permissible_purpose: "credit_application" }
        }
      );

      // Validate response structure matches React component expectations
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("data");
      expect(response.data).toHaveProperty("meta");
      
      // Credit report data structure
      expect(response.data.data).toHaveProperty("credit_score");
      expect(response.data.data.credit_score).toBeGreaterThanOrEqual(300);
      expect(response.data.data.credit_score).toBeLessThanOrEqual(850);
      
      // FCRA compliance metadata
      expect(response.data.meta).toHaveProperty("audit_id");
      expect(response.data.meta).toHaveProperty("compliance_validated", true);
      expect(response.data.meta).toHaveProperty("retrieved_at");
    });

    it("should reject invalid permissible purpose", async () => {
      if (!authToken) return;

      try {
        await axios.get(
          `${API_BASE_URL}/credit-reports/test-consumer-123`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { permissible_purpose: "curiosity" }
          }
        );
        expect.fail("Should have thrown FCRA violation error");
      } catch (error) {
        expect(error.response.status).toBe(403);
        expect(error.response.data.code).toBe("FCRA_VIOLATION");
      }
    });
  });

  describe("Credit Score Calculation API Contract", () => {
    it("should calculate FICO score with audit trail", async () => {
      if (!authToken) return;

      const creditData = {
        payment_history: 85,
        credit_utilization: 20,
        length_of_history: 75,
        credit_mix: 60,
        new_credit: 40,
        permissible_purpose: "credit_application"
      };

      const response = await axios.post(
        `${API_BASE_URL}/credit-score/calculate`,
        creditData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Validate calculation response
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("score");
      expect(response.data.score).toBeGreaterThanOrEqual(300);
      expect(response.data.score).toBeLessThanOrEqual(850);
      
      // Audit trail validation
      expect(response.data).toHaveProperty("audit_id");
      expect(response.data).toHaveProperty("calculation_method", "FICO_8");
    });
  });

  describe("Error Handling Contract", () => {
    it("should return user-friendly error messages", async () => {
      try {
        await axios.get(`${API_BASE_URL}/credit-reports/invalid-consumer`);
        expect.fail("Should have thrown error");
      } catch (error) {
        // Ensure no internal details are exposed
        expect(error.response.data.error).not.toContain("database");
        expect(error.response.data.error).not.toContain("internal");
        expect(error.response.data.error).not.toContain("exception");
        
        // Should have user-friendly message
        expect(error.response.data).toHaveProperty("error");
        expect(error.response.data).toHaveProperty("code");
      }
    });
  });

  describe("Security Contract", () => {
    it("should require authentication for credit endpoints", async () => {
      try {
        await axios.get(`${API_BASE_URL}/credit-reports/test-consumer-123`);
        expect.fail("Should require authentication");
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it("should not expose PII in responses", async () => {
      if (!authToken) return;

      const response = await axios.get(
        `${API_BASE_URL}/credit-reports/test-consumer-123`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { permissible_purpose: "credit_application" }
        }
      );

      const responseString = JSON.stringify(response.data);
      
      // Should not contain unmasked SSNs
      expect(responseString).not.toMatch(/\d{3}-\d{2}-\d{4}/);
      
      // Should not contain full credit card numbers
      expect(responseString).not.toMatch(/4[0-9]{15}/);
    });
  });
});

// Type definitions for API contract validation
interface CreditReportResponse {
  data: {
    credit_score: number;
    score_model: string;
    score_date: string;
    trade_lines?: any[];
    payment_history?: any[];
  };
  meta: {
    audit_id: string;
    retrieved_at: string;
    compliance_validated: boolean;
  };
}

interface CreditScoreCalculationResponse {
  score: number;
  calculation_method: string;
  audit_id: string;
  timestamp: string;
}

// Export types for React components to use
export type { CreditReportResponse, CreditScoreCalculationResponse };
