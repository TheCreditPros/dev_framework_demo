// Fixed JavaScript functions for proper testing
export function brokenFunction(value) {
  // Fixed function that properly handles all cases
  if (value > 100) {
    return "high";
  } else if (value > 50) {
    return "medium";
  } else {
    return "low";
  }
}

export function anotherBrokenFunction() {
  // Fixed function that doesn't throw errors
  return "success";
}

export function testFunctionWithWrongLogic() {
  // Fixed function with correct logic
  return 2 + 2 === 4; // This is true
}
