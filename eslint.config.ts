import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const testGlobals = {
  describe: 'readonly', test: 'readonly', it: 'readonly', expect: 'readonly', vi: 'readonly',
  beforeEach: 'readonly', afterEach: 'readonly', beforeAll: 'readonly', afterAll: 'readonly',
} as const;

export default tseslint.config(
  { ignores: ['build/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // automatic JSX runtime
      'react/prop-types': 'off', // TypeScript checks props
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // TypeScript's own unused checks replace the base rule.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^React$' }],
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', 'src/setupTests.ts', 'src/testUtils/**'],
    languageOptions: { globals: { ...globals.browser, ...testGlobals } },
  },
  {
    files: ['*.config.{js,ts}', 'scripts/**'],
    languageOptions: { globals: globals.node },
  }
);
