import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  // グローバル除外設定
  {
    ignores: [
      '**/dist/',
      '**/build/',
      '**/node_modules/',
      '**/.turbo/',
      '**/coverage/',
      '**/*.d.ts',
      '**/.next/',
      '**/out/',
      '**/.pnpm-store/',
      '**/playwright-report/',
      '**/*.log',
      '**/.DS_Store',
      '**/data/'
    ],
  },
  
  // 基本のESLint推奨設定
  js.configs.recommended,
  
  // グローバル設定
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.node,
      },
    },
  },
  
  // TypeScriptファイル設定
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json', './packages/*/*/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript固有のルール
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
      }],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: true,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
      ],
    },
  },
  
  // React/JSXファイル設定
  {
    files: ['apps/web/**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 17+では不要
      'react/prop-types': 'off', // TypeScriptで型チェック
      'react/jsx-no-leaked-render': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/self-closing-comp': 'error',
      'react/jsx-sort-props': ['error', {
        callbacksLast: true,
        shorthandFirst: true,
        reservedFirst: true,
      }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  
  // Node.js（APIサーバー）設定
  {
    files: ['apps/api/**/*.ts', 'scripts/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off', // APIではconsole使用可
      '@typescript-eslint/no-var-requires': 'off', // scriptsでrequire許可
    },
  },
  
  // テストファイル設定
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/test/**', '**/tests/**'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.vitest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  
  // 設定ファイル
  {
    files: ['**/*.config.{js,ts}', '**/.*rc.{js,ts}'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  
  // Prettier統合（最後に配置）
  prettierRecommended,
);