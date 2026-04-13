import js from '@eslint/js';
import ts from 'typescript-eslint';
import globals from 'globals';

export const baseConfig = ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-case-declarations': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-prototype-builtins': 'off',
      'no-redeclare': 'off',
      'no-fallthrough': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      'no-func-assign': 'off',
      'no-empty': 'off',
      'prefer-const': 'off',
      'no-async-promise-executor': 'off',
      'no-constant-condition': 'off',
      'no-empty-pattern': 'off',
      'no-extra-boolean-cast': 'off',
      'no-inner-declarations': 'off',
      'no-mixed-spaces-and-tabs': 'off',
      'no-self-assign': 'off',
      'no-unreachable': 'off',
      'no-unsafe-finally': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-unused-labels': 'off',
      'no-useless-backreference': 'off',
      'no-useless-catch': 'off',
      'no-cond-assign': 'off',
      'no-misleading-character-class': 'off',
      'no-control-regex': 'off',
      'no-undef': 'off',
      'no-sparse-arrays': 'off',
      'no-invalid-regexp': 'off',
      'no-constant-binary-expression': 'off',
      'no-debugger': 'off',
    },
  }
);
