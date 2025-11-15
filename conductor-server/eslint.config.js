// eslint.config.js – bridge for ESLint 9 to use existing .eslintrc.json
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  js.configs.recommended,
  ...compat.config({
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    env: { node: true, es2022: true },
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  }),
];
