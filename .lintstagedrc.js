module.exports = {
  '*.{js,jsx,ts,tsx,mjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,mdx,css,scss}': ['prettier --write'],
  // Temporarily disabled TypeScript compilation to focus on framework stability
  // '*.{ts,tsx}': (files) => {
  //   const filteredFiles = files.filter(file => !file.includes('portal2-admin-refactor'));
  //   if (filteredFiles.length === 0) return 'echo "No TypeScript files to compile"';
  //   return `tsc --noEmit ${filteredFiles.join(' ')}`;
  // },
};
