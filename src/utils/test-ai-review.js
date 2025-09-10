/**
 * Test utility for Qodo AI PR Review System
 * This file contains intentional issues for AI analysis
 */

// TODO: Add proper JSDoc documentation
function calculateScore(data) {
  // TODO: Add input validation
  if (!data || !Array.isArray(data.scores)) {
    return 0;
  }

  let total = 0;
  // TODO: Consider using reduce() for better performance
  for (let i = 0; i < data.scores.length; i++) {
    total += data.scores[i];
  }

  // TODO: Add error handling for division by zero
  return total / data.scores.length;
}

// TODO: Add proper error handling
function validateUserInput(input) {
  // Basic validation - could be improved
  if (typeof input !== "string") return false;
  if (input.length < 1) return false;
  if (input.length > 100) return false;

  // TODO: Add more comprehensive validation
  return true;
}

module.exports = {
  calculateScore,
  validateUserInput,
};
