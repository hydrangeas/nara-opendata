# 環境構築ガイド

## プロジェクト構成

### モノレポ構成

```
nara-opendata/
├── apps/                      # アプリケーション層
│   ├── api/                   # Fastify APIサーバー
│   │   ├── src/
│   │   │   ├── contexts/      # APIの境界づけられたコンテキスト
│   │   │   │   ├── api-management/    # API管理コンテキスト
│   │   │   │   ├── authentication/    # 認証コンテキスト（API版）
│   │   │   │   └── data-provision/    # データ提供コンテキスト
│   │   │   ├── presentation/  # プレゼンテーション層
│   │   │   │   ├── routes/    # APIルート
│   │   │   │   ├── middleware/# ミドルウェア
│   │   │   │   ├── plugins/   # Fastifyプラグイン
│   │   │   │   └── schemas/   # リクエスト/レスポンススキーマ
│   │   │   ├── shared/        # API内共有コード
│   │   │   │   ├── di/        # 依存性注入
│   │   │   │   ├── config/    # 設定
│   │   │   │   └── adapters/  # 外部サービスアダプター
│   │   │   ├── server.ts      # サーバー設定
│   │   │   └── index.ts       # エントリーポイント
│   │   ├── tests/             # 統合テスト・E2Eテスト
│   │   │   ├── integration/
│   │   │   └── fixtures/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── vercel.json
│   │
│   └── web/                   # Vite Webフロントエンド
│       ├── src/
│       │   ├── contexts/      # Webの境界づけられたコンテキスト
│       │   │   └── authentication/    # 認証コンテキスト（Web版）
│       │   ├── pages/         # ページコンポーネント
│       │   ├── components/    # UIコンポーネント
│       │   ├── services/      # APIクライアント
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── tests/             # E2Eテスト
│       │   └── e2e/
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── vitest.config.ts
│       └── playwright.config.ts
│
├── packages/                  # 共有パッケージ
│   ├── shared-kernel/         # 最小限の共有（DDDのShared Kernel）
│   │   ├── src/
│   │   │   ├── value-objects/# 基本的な値オブジェクト
│   │   │   │   ├── UserId.ts
│   │   │   │   ├── Email.ts
│   │   │   │   └── UserTier.ts
│   │   │   ├── types/        # 基本型定義
│   │   │   └── exceptions/   # 基本例外
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── libs/                  # 技術的なライブラリ（ドメインではない）
│       ├── types/             # TypeScript型定義・DTO
│       │   ├── src/
│       │   │   ├── api/       # APIレスポンス型
│       │   │   ├── dto/       # データ転送オブジェクト
│       │   │   └── errors/    # エラー型定義
│       │   ├── package.json
│       │   └── tsconfig.json
│       │
│       ├── validation/        # 共通バリデーション
│       │   ├── src/
│       │   │   ├── schemas/   # Zodスキーマ
│       │   │   └── rules/     # カスタムルール
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   └── vitest.config.ts
│       │
│       └── utils/             # 汎用ユーティリティ
│           ├── src/
│           │   ├── date/      # 日付処理
│           │   ├── env/       # 環境変数管理
│           │   └── constants/ # 定数
│           ├── package.json
│           ├── tsconfig.json
│           └── vitest.config.ts
│
├── data/                      # オープンデータファイル
├── database/                  # データベース関連
├── scripts/                   # ビルド・ユーティリティスクリプト
├── docs/                      # プロジェクトドキュメント
├── .github/                   # GitHub設定
├── .husky/                    # Git hooks
├── .vscode/                   # VSCode設定
├── pnpm-workspace.yaml        # pnpmワークスペース設定
├── turbo.json                 # Turborepo設定
├── .env.example               # 環境変数サンプル
├── .eslintrc.js               # ESLint設定
├── .prettierrc                # Prettier設定
├── package.json               # ルートパッケージ
├── tsconfig.base.json         # 共通TypeScript設定
└── README.md                  # プロジェクトREADME

```

### 共通ロジックの分類

#### 1. packages/shared-kernel（DDDのShared Kernel）
- **Value Objects**: UserId, Email, UserTier など基本的な値オブジェクト
- **Types**: システム全体で共有される基本型定義
- **Exceptions**: DomainException, ValidationException など基本例外クラス
- **原則**: ビジネスロジックは含まず、安定した基本概念のみ

#### 2. packages/libs/types（技術的な型定義）
- **API Types**: リクエスト/レスポンス型
- **DTO Types**: データ転送オブジェクト型
- **Error Types**: APIエラー型定義

#### 3. packages/libs/validation（共通バリデーション）
- **Zodスキーマ**: APIパラメータ検証
- **カスタムルール**: メールアドレス等の汎用検証ルール

#### 4. packages/libs/utils（汎用ユーティリティ）
- **日付処理**: DateTime操作・フォーマット
- **環境変数管理**: 型安全な環境変数の検証と取得
- **定数**: エラーコード、設定値

## 開発環境とツールチェーン

### 必須ツール

```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### パッケージマネージャー設定

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'packages/libs/*'
```

### Turborepo設定

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": [],
      "cache": false
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

### 共通TypeScript設定

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Linter & Formatter設定

### ESLint設定（モノレポルート）

```js
// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json', './packages/libs/*/tsconfig.json']
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
    
    // Import
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' }
      }
    ],
    
    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error'
  },
  overrides: [
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      settings: {
        react: {
          version: 'detect'
        }
      }
    },
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      extends: ['plugin:vitest/recommended']
    }
  ]
}
```

### Prettier設定

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf",
  "arrowParens": "always"
}
```

## テスト戦略

### テストフレームワーク
- **Unit/Integration**: Vitest
- **E2E**: Playwright

### テスト構成

```
# ユニットテスト（コロケーションパターン）
apps/api/src/contexts/api-management/domain/models/RateLimitPolicy.test.ts
apps/web/src/components/AuthButtons.test.tsx
packages/shared-kernel/src/value-objects/Email.test.ts

# 統合テスト・E2Eテスト（専用ディレクトリ）
apps/api/tests/
├── integration/        # API統合テスト
│   ├── auth.integration.test.ts
│   └── data.integration.test.ts
└── fixtures/          # テストデータ

apps/web/tests/
└── e2e/               # E2Eテスト
    ├── auth.spec.ts
    └── navigation.spec.ts
```

### Vitest設定

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nara-opendata/shared-kernel': path.resolve(__dirname, '../../packages/shared-kernel/src'),
      '@nara-opendata/types': path.resolve(__dirname, '../../packages/libs/types/src'),
      '@nara-opendata/validation': path.resolve(__dirname, '../../packages/libs/validation/src'),
      '@nara-opendata/utils': path.resolve(__dirname, '../../packages/libs/utils/src')
    }
  }
});
```

## 環境管理戦略

### 環境の種類

1. **local**: ローカル開発環境
2. **test**: 自動テスト環境
3. **develop**: 開発環境（Vercel Preview）
4. **staging**: ステージング環境（本番相当）
5. **production**: 本番環境

### 環境変数管理

```
.env                    # デフォルト値（コミット可）
.env.local              # ローカル開発（gitignore）
.env.test               # テスト環境
.env.staging            # ステージング環境
.env.production         # 本番環境
```

### 環境変数の型安全管理

```ts
// packages/libs/utils/src/env/index.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
  
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // API
  API_PORT: z.string().default('3000'),
  API_HOST: z.string().default('0.0.0.0'),
  API_BASE_URL: z.string().url(),
  
  // Auth
  JWT_SECRET: z.string().min(32),
  
  // Rate Limiting
  RATE_LIMIT_TIER1: z.string().default('60'),
  RATE_LIMIT_TIER2: z.string().default('120'),
  RATE_LIMIT_TIER3: z.string().default('300'),
  
  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  
  // Feature Flags
  FEATURE_API_DOCS: z.enum(['enabled', 'disabled']).default('enabled'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment variables');
  }
  
  return parsed.data;
}
```

## CI/CDパイプライン

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm run test:unit
      - run: pnpm run test:integration
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      
      - uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            apps/web/dist
            apps/api/dist
```

### Vercelデプロイ設定

```json
// vercel.json (ルート)
{
  "framework": null,
  "buildCommand": "pnpm turbo run build",
  "installCommand": "pnpm install",
  "ignoreCommand": "npx turbo-ignore"
}
```

```json
// apps/api/vercel.json
{
  "functions": {
    "api/index.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

## セキュリティ設定

### Git hooks（Husky + lint-staged）

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ]
  }
}
```

### セキュリティヘッダー（Vercel）

```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

## 開発フロー

### ブランチ戦略
- **main**: 本番環境
- **develop**: 開発環境
- **feature/***: 機能開発
- **fix/***: バグ修正
- **release/***: リリース準備

### コミット規約
[Conventional Commits](https://www.conventionalcommits.org/)に従う：
- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `style:` コードスタイル
- `refactor:` リファクタリング
- `test:` テスト
- `chore:` ビルド・ツール

### リリースフロー
1. `develop`から`release/x.x.x`ブランチ作成
2. バージョン更新、CHANGELOG作成
3. `staging`環境でテスト
4. `main`にマージ → 本番デプロイ
5. タグ作成

## まとめ

この環境構築により以下が実現されます：

1. **コード共有**: モノレポによる効率的な共通コード管理
2. **型安全性**: TypeScript + Zodによる完全な型安全
3. **品質保証**: ESLint + Prettier + Huskyによる自動品質管理
4. **テスト**: Vitestによる高速で信頼性の高いテスト
5. **CI/CD**: GitHub Actions + Vercelによる自動化
6. **環境管理**: 明確な環境分離と設定管理
7. **セキュリティ**: 多層防御による安全性確保

この構成により、保守性・拡張性・開発効率が大幅に向上します。