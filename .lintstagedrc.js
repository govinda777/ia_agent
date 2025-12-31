// .lintstagedrc.js
const typeCheckCommand = 'tsc --noEmit --pretty';

module.exports = {
  '*.{ts,tsx}': [typeCheckCommand],
};
