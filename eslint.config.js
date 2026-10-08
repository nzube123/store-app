import globals from 'globals';
import base from './packages/config/eslint/index.js';

export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
];