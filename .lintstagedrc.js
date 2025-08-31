module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,mdx,css,scss}': ['prettier --write'],
  '*.py': ['bash scripts/format-python.sh'],
};
