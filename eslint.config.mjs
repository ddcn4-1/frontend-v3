import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import sonarjs from 'eslint-plugin-sonarjs';
import security from 'eslint-plugin-security';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import boundariesPlugin from 'eslint-plugin-boundaries';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylistic,
  sonarjs.configs.recommended,
  security.configs.recommended,
  prettierConfig,
  {
    ignores: [
      'node_modules/**',
      '*/node_modules/**',
      'apps/*/dist/**',
      'apps/*/build/**',
      'packages/*/dist/**',
      '.turbo/**',
      'coverage/**',
      'reports/**',
      '*.config.{js,mjs,ts}',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      prettier: prettier,
      boundaries: boundariesPlugin,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // TypeScript ESLint rules (aligned with @rushstack/eslint-config principles)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          args: 'all',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-target-blank': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',

      // General best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      'sonarjs/prefer-read-only-props': 'warn',
      'sonarjs/no-nested-template-literals': 'warn',
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/no-nested-functions': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/no-unused-vars': 'warn',
      'sonarjs/no-dead-store': 'warn',
      'sonarjs/unused-import': 'warn',
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/pseudo-random': 'warn',
      'no-empty': 'warn',
      'no-case-declarations': 'warn',
      'sonarjs/deprecation': 'warn',
      'sonarjs/redundant-type-aliases': 'warn',
      'sonarjs/todo-tag': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'off',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // FSD (Feature-Sliced Design) Architecture Rules
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // App layer can import from any layer
            {
              from: ['app'],
              allow: ['app', 'pages', 'widgets', 'features', 'entities', 'shared'],
            },
            // Pages can import from widgets, features, entities, shared
            {
              from: ['pages'],
              allow: ['widgets', 'features', 'entities', 'shared'],
            },
            // Widgets can import from features, entities, shared
            {
              from: ['widgets'],
              allow: ['features', 'entities', 'shared'],
            },
            // Features can import from entities, shared
            {
              from: ['features'],
              allow: ['entities', 'shared'],
            },
            // Entities can only import from shared
            {
              from: ['entities'],
              allow: ['shared'],
            },
            // Shared cannot import from other layers (except other shared modules)
            {
              from: ['shared'],
              allow: ['shared'],
            },
          ],
        },
      ],
      'boundaries/no-unknown': ['error'],
      'boundaries/no-unknown-files': ['warn'],
    },
    settings: {
      react: {
        version: 'detect',
      },
      'boundaries/elements': [
        {
          type: 'app',
          pattern: 'apps/*/src/app/**',
          mode: 'folder',
          capture: ['appName'],
        },
        {
          type: 'pages',
          pattern: 'apps/*/src/pages/**',
          mode: 'folder',
          capture: ['appName', 'pageName'],
        },
        {
          type: 'widgets',
          pattern: 'apps/*/src/widgets/**',
          mode: 'folder',
          capture: ['appName', 'widgetName'],
        },
        {
          type: 'features',
          pattern: 'apps/*/src/features/**',
          mode: 'folder',
          capture: ['appName', 'featureName'],
        },
        {
          type: 'entities',
          pattern: 'apps/*/src/entities/**',
          mode: 'folder',
          capture: ['appName', 'entityName'],
        },
        {
          type: 'shared',
          pattern: [
            'apps/*/src/shared/**',
            'packages/shared/**',
            'packages/design-system/**',
          ],
          mode: 'folder',
          capture: ['appName'],
        },
      ],
      'boundaries/ignore': [
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.stories.*',
        '**/*.config.*',
        '**/vite-env.d.ts',
      ],
    },
  },
  // packages에 대해 더 엄격한 규칙 적용
  {
    files: ['packages/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
