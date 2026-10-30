import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

const testGlobals = {
  describe: 'readonly', test: 'readonly', it: 'readonly', expect: 'readonly', vi: 'readonly',
  beforeEach: 'readonly', afterEach: 'readonly', beforeAll: 'readonly', afterAll: 'readonly',
};

export default [
  { ignores: ['build/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
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
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^React$' }],
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/setupTests.js', 'src/testUtils/**'],
    languageOptions: { globals: { ...globals.browser, ...testGlobals } },
  },
  {
    files: ['*.config.js', 'scripts/**'],
    languageOptions: { globals: globals.node },
  },
];
