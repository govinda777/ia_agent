module.exports = {
  // Run TypeScript type checking on staged .ts and .tsx files
  '**/*.{ts,tsx}': () => 'npx tsc --noEmit --skipLibCheck',
  
  // Lint and format TypeScript and JavaScript files
  '**/*.{js,jsx,ts,tsx}': [
    'npx eslint --fix --max-warnings=0',
    'npx prettier --write',
  ],
  
  // Format other files with Prettier
  '**/*.{json,md,mdx,yml,yaml}': ['npx prettier --write'],
};
