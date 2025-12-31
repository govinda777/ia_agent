module.exports = {
  // Run TypeScript type checking on staged .ts and .tsx files
  '**/*.{ts,tsx}': () => 'tsc --noEmit --skipLibCheck',
  
  // Lint and format TypeScript and JavaScript files
  '**/*.{js,jsx,ts,tsx}': [
    'eslint --fix --max-warnings=0',
    'prettier --write',
  ],
  
  // Format other files with Prettier
  '**/*.{json,md,mdx,yml,yaml}': ['prettier --write'],
};
