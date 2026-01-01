import type { KnipConfig } from 'knip';

export default {
  // Entry points do Next.js 15 App Router
  entry: [
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/**/{layout,page,loading,error,not-found}.{ts,tsx}',
    'src/app/api/**/route.ts',
    'src/middleware.ts',
    'drizzle.config.ts',
    'next.config.js'
  ],

  // Arquivos do projeto para analisar
  project: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.{test,spec}.{ts,tsx,js,jsx}',
    '!src/**/*.stories.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts'
  ],

  // Ignorar arquivos e diretórios
  ignore: [
    // Arquivos gerados
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
    '**/out/**',
    
    // Dependências
    '**/node_modules/**',
    
    // Testes e specs
    '**/__tests__/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
    '**/*.stories.{ts,tsx,js,jsx}',
    
    // Scripts e documentação
    'scripts/**',
    'docs/**',
    'coverage/**',
    
    // Arquivos de configuração de ferramentas
    '.github/**',
    '.husky/**',
    '.vscode/**',
    
    // Arquivos temporários
    '**/*.tmp',
    '**/*.temp',
    '**/.cache/**',
    
    // Logs e relatórios
    '**/*.log',
    '**/reports/**',
    'knip-report.json'
  ],

  // Dependências que devem ser ignoradas (usadas indiretamente)
  ignoreDependencies: [
    // Type definitions
    '@types/*',
    
    // Configurações de linting e formatação
    'eslint-config-*',
    'eslint-plugin-*',
    '@typescript-eslint/*',
    'prettier',
    'prettier-plugin-*',
    
    // Ferramentas de desenvolvimento
    'husky',
    'lint-staged',
    'commitizen',
    'cz-conventional-changelog',
    
    // Tailwind CSS e plugins
    '@tailwindcss/*',
    'tailwindcss',
    'autoprefixer',
    'postcss',
    
    // Ferramentas de build
    '@swc/*',
    'swc',
    'terser',
    
    // Testes
    'vitest',
    '@vitest/*',
    'jsdom',
    '@testing-library/*',
    'playwright',
    
    // Ferramentas de análise
    'knip',
    '@knip/*',
    
    // Outras ferramentas dev
    'cross-env',
    'concurrently',
    'nodemon',
    'pm2'
  ],

  // Dependências de produção para análise
  // Use --production flag when running knip for production mode

  // Plugins específicos
  // Plugins são automaticamente detectados, mas podem ser configurados explicitamente
  // Exemplo: { "next": true, "typescript": true }

  // Configurações específicas por tipo de análise
  rules: {
    // Regras para dependências não usadas
    dependencies: 'error',
    
    // Regras para exports não usados
    exports: 'error',
    
    // Regras para arquivos não usados
    files: 'error'
  },

  // Configurações de saída - use --reporter flag quando executar knip
  // Ex: knip --reporter compact

  // Configurações específicas para workspaces (se monorepo)
  workspaces: {
    '.': {
      entry: [
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/app/**/{layout,page,loading,error,not-found}.{ts,tsx}',
        'src/app/api/**/route.ts',
        'src/middleware.ts',
        'drizzle.config.ts',
        'next.config.js'
      ],
      project: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.{test,spec}.{ts,tsx,js,jsx}'
      ],
      ignore: [
        '**/.next/**',
        '**/node_modules/**',
        'scripts/**',
        'docs/**'
      ]
    }
  }
} satisfies KnipConfig;
