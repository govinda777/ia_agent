module.exports = {
  // Run TypeScript type checking on staged .ts and .tsx files using npm script
  '**/*.{ts,tsx}': () => 'npm run lint:check',
  
  // Lint and format TypeScript and JavaScript files
  '**/*.{js,jsx,ts,tsx}': [
    'npm run lint:fix',
    'npm run format',
  ],
  
  // Format other files with Prettier
  '**/*.{json,md,mdx,yml,yaml}': ['npm run format'],
};
