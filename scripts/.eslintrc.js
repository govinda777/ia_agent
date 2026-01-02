module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'prefer-const': 'warn',
    'no-process-exit': 'off',
    'no-sync': 'off',
    'semi': ['warn', 'always'],
    'quotes': ['warn', 'single'],
  },
};
