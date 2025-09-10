/**
 * Test utility for AI review system validation
 * This file contains example functions for testing purposes
 */

function calculateScore(data) {
  if (!data || !Array.isArray(data.scores)) {
    return 0;
  }

  let total = 0;
  for (let i = 0; i < data.scores.length; i++) {
    total += data.scores[i];
  }

  return total / data.scores.length;
}

function validateUserInput(input) {
  if (typeof input !== "string") return false;
  if (input.length < 1) return false;
  if (input.length > 100) return false;

  return true;
}

module.exports = {
  calculateScore,
  validateUserInput,
};
