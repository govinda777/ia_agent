module.exports = {
  // Configuração específica para scripts .mjs
  extends: [
    'eslint:recommended',
  ],
  env: {
    es2022: true,
    node: true,
  },
  parser: 'espree',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Desabilitar regras que causam falsos positivos em .mjs
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'prefer-const': 'warn',
    'no-process-exit': 'off',
    'no-sync': 'off',
    'semi': ['warn', 'always'],
    'quotes': ['warn', 'single'],
  },
};
