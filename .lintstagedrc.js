module.exports = {
  '*.{js,jsx,ts,tsx,mjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,mdx,css,scss}': ['prettier --write'],
  '*.{ts,tsx}': () => 'tsc --noEmit',
};
