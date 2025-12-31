module.exports = {
  // Run linting on staged files using relative paths
  '**/*.{js,jsx,ts,tsx}': [
    (filenames) => filenames.map(f => `npx eslint "${f}" --fix`).join(' && '),
    (filenames) => filenames.map(f => `npx prettier --write "${f}"`).join(' && '),
  ],
  
  // Format other files with Prettier
  '**/*.{json,md,mdx,yml,yaml}': (filenames) => filenames.map(f => `npx prettier --write "${f}"`).join(' && '),
};
