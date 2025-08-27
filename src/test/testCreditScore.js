// Test file with intentional issues to validate auto-improvement
function calculateCreditScore(data) {
  // Hardcoded SSN for testing auto-masking
  const testSSN = "***-**-6789";
  
  // Credit score calculation without audit trail (should trigger auto-fix)
  const score = data.paymentHistory * 0.35 + 
                data.creditUtilization * 0.30 + 
                data.lengthOfHistory * 0.15;
  
  return score;
}

// Credit data access without permissible purpose validation
function accessCreditReport(userId) {
  // This should trigger compliance auto-fix
  return fetch(`/api/credit-reports/${userId}`);
}

module.exports = { calculateCreditScore, accessCreditReport };
