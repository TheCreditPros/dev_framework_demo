// Intentional style issues for dirty PR validation

export function badFormat(value: number) {
  // Intentionally unused variable for testing purposes
  const _UNUSED = 123;
  void _UNUSED; // Suppress TypeScript unused variable warning
  return value + 1;
}
