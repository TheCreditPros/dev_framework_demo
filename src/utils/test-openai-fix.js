/**
 * Test file to validate OpenAI API key configuration fix
 * This validates that Qodo AI can properly access the organization-level API key
 */

// TODO: Add proper input validation
function processUserData(data) {
  // Basic validation
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data provided');
  }

  // TODO: Add comprehensive validation
  return {
    processed: true,
    timestamp: new Date().toISOString(),
    data: data
  };
}

// TODO: Add error handling and logging
function calculateMetrics(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { error: 'Invalid input: expected non-empty array' };
  }

  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    sum,
    average,
    min,
    max,
    count: values.length
  };
}

module.exports = {
  processUserData,
  calculateMetrics
};
