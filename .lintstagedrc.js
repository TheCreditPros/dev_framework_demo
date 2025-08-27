module.exports = {
  '*.{js,jsx,ts,tsx,mjs}': ['eslint --fix', 'prettier --write', 'git add'],
  '*.{json,md,mdx,css,scss}': ['prettier --write', 'git add'],
  '*.{ts,tsx}': ['tsc --noEmit'],
};
