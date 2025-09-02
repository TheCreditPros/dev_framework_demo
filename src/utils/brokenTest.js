// Intentional broken JavaScript for Vitest validation
export function brokenFunction(value) {
  // This function has intentional issues for testing
  console.log('This will cause test failures');

  // Missing return statement
  // This should cause test failures
  if (value > 100) {
    return 'high';
  }
  // Missing else case - will return undefined
}

export function anotherBrokenFunction() {
  // This function throws an error
  throw new Error('Intentional error for testing');
}

export function testFunctionWithWrongLogic() {
  // This function has wrong logic that will fail tests
  return 2 + 2 === 5; // This is false, should be true
}
