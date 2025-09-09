import "@testing-library/jest-dom/vitest";

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.TCP_DOMAIN = "credit_repair";
process.env.FCRA_COMPLIANCE_MODE = "true";

// Credit repair domain test utilities
global.mockCreditData = {
  validScore: 720,
  invalidScore: 900,
  validPurpose: "credit_application",
  invalidPurpose: "invalid_purpose",
  sampleFactors: [
    "Payment history: 35%",
    "Credit utilization: 30%",
    "Length of credit history: 15%",
  ],
};

// FCRA compliance test helpers
global.fcraTestHelpers = {
  validateScoreRange: (score) => score >= 300 && score <= 850,
  mockAuditLog: (action, userId) => ({
    action,
    userId,
    timestamp: new Date().toISOString(),
    compliance: "FCRA_604",
  }),
  encryptPII: (data) => `encrypted_${btoa(data)}`,
};
