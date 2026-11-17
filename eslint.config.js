import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    '**/dist',
    '**/node_modules',
    '**/coverage',
    'backend/src/generated',
    'e2e/playwright-report',
    'e2e/test-results',
    'e2e/.app-dist',
  ]),

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Frontend: browser globals, React hooks rules, Fast Refresh and accessibility.
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat['recommended-latest'], jsxA11y.flatConfigs.recommended],
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // shadcn/ui primitives export variants alongside components.
    files: ['frontend/src/components/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // Node code: backend, shared package, tests, scripts and tool configs.
  {
    files: [
      'backend/**/*.ts',
      'shared/**/*.ts',
      'e2e/**/*.ts',
      '**/*.config.{js,ts}',
      'frontend/vite.config.ts',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    // CLI entry points report progress on the console.
    files: ['backend/prisma/seed.ts'],
    rules: { 'no-console': 'off' },
  },
])
