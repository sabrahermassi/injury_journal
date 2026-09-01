import js from '@eslint/js';
import globals from 'globals';

// Flat config, replacing the legacy .eslintrc that ESLint 9+ no longer reads
// (issue #30). Rules are carried over from that file unchanged.
export default [
  {
    ignores: ['node_modules/**', 'coverage/**', 'generated/**'],
  },

  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      semi: ['error', 'always'],
      // avoidEscape lets a string keep double quotes when it contains an
      // apostrophe, rather than forcing an uglier escaped single-quote.
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: ['error', 2],
      'no-unused-vars': 'warn',
    },
  },

  // Jest injects describe/test/expect/beforeEach as globals rather than
  // imports, so no-undef would flag every test file without this.
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
