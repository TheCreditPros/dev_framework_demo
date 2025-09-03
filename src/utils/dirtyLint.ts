// Intentional style issues for dirty PR validation

export function badFormat(value: number) {
  console.log('bad', value);
  // Intentionally unused variable for testing purposes
  const _UNUSED = 123;
  void _UNUSED; // Suppress TypeScript unused variable warning
  return value + 1;
}
