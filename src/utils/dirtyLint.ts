// Intentional style issues for dirty PR validation

export function badFormat(value: number) {
  console.log('bad', value);
  const UNUSED = 123;
  return value + 1;
}
