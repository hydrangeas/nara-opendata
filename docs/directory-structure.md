# プロジェクトディレクトリ構造

本ドキュメントは、オープンデータ提供APIプロジェクトのディレクトリ構造を定義します。
DDDの原則に基づき、各アプリケーションが独自の境界づけられたコンテキストを持つ構造を採用しています。

## 技術スタック

- **言語**: TypeScript
- **フレームワーク**: Fastify（API）、Vite（Web）
- **認証**: Supabase Auth
- **データベース**: Supabase (PostgreSQL)
- **デプロイ**: Vercel
- **パッケージ管理**: pnpm workspaces
- **ビルドツール**: Turborepo
- **テスト**: Vitest（単体・統合）、Playwright（E2E）

## 基本設計方針

1. **境界づけられたコンテキストの独立性**: 各アプリケーションが独自のコンテキストを持つ
2. **共有の最小化**: shared-kernelには本当に必要な値オブジェクトのみ
3. **テストのコロケーション**: ユニットテストは対象コードの隣に配置
4. **DDD原則の遵守**: コンテキスト間の結合を避け、明示的なインターフェースで連携

## ディレクトリ構造

```
nara-opendata/
├── apps/                              # アプリケーション層
│   ├── api/                           # Fastify APIサーバー
│   │   ├── src/
│   │   │   ├── contexts/              # APIの境界づけられたコンテキスト
│   │   │   │   ├── api-management/    # API管理コンテキスト
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── models/
│   │   │   │   │   │   │   ├── RateLimitPolicy.ts
│   │   │   │   │   │   │   ├── RateLimitPolicy.test.ts
│   │   │   │   │   │   │   ├── APIEndpoint.ts
│   │   │   │   │   │   │   └── APIEndpoint.test.ts
│   │   │   │   │   │   ├── services/
│   │   │   │   │   │   │   ├── RateLimitingService.ts
│   │   │   │   │   │   │   └── RateLimitingService.test.ts
│   │   │   │   │   │   └── repositories/
│   │   │   │   │   │       └── IRateLimitRepository.ts
│   │   │   │   │   ├── application/
│   │   │   │   │   │   ├── RateLimitUseCase.ts
│   │   │   │   │   │   └── RateLimitUseCase.test.ts
│   │   │   │   │   └── infrastructure/
│   │   │   │   │       ├── RateLimitRepositoryImpl.ts
│   │   │   │   │       └── RateLimitRepositoryImpl.test.ts
│   │   │   │   │
│   │   │   │   ├── authentication/    # 認証コンテキスト（API版）
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── models/
│   │   │   │   │   │   │   ├── ApiUser.ts
│   │   │   │   │   │   │   └── ApiUser.test.ts
│   │   │   │   │   │   ├── services/
│   │   │   │   │   │   │   ├── TokenValidationService.ts
│   │   │   │   │   │   │   └── TokenValidationService.test.ts
│   │   │   │   │   │   └── events/
│   │   │   │   │   │       ├── UserAuthenticated.ts
│   │   │   │   │   │       └── AuthenticationFailed.ts
│   │   │   │   │   ├── application/
│   │   │   │   │   │   ├── AuthenticateUseCase.ts
│   │   │   │   │   │   ├── AuthenticateUseCase.test.ts
│   │   │   │   │   │   ├── RefreshTokenUseCase.ts
│   │   │   │   │   │   └── RefreshTokenUseCase.test.ts
│   │   │   │   │   └── infrastructure/
│   │   │   │   │       ├── SupabaseAuthAdapter.ts
│   │   │   │   │       └── SupabaseAuthAdapter.test.ts
│   │   │   │   │
│   │   │   │   └── data-provision/    # データ提供コンテキスト
│   │   │   │       ├── domain/
│   │   │   │       │   ├── models/
│   │   │   │       │   │   ├── OpenDataResource.ts
│   │   │   │       │   │   └── OpenDataResource.test.ts
│   │   │   │       │   ├── services/
│   │   │   │       │   │   ├── DataAccessService.ts
│   │   │   │       │   │   └── DataAccessService.test.ts
│   │   │   │       │   └── repositories/
│   │   │   │       │       └── IOpenDataRepository.ts
│   │   │   │       ├── application/
│   │   │   │       │   ├── DataRetrievalUseCase.ts
│   │   │   │       │   └── DataRetrievalUseCase.test.ts
│   │   │   │       └── infrastructure/
│   │   │   │           ├── FileSystemRepository.ts
│   │   │   │           └── FileSystemRepository.test.ts
│   │   │   │
│   │   │   ├── presentation/          # プレゼンテーション層
│   │   │   │   ├── routes/            # APIルート
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── auth.ts
│   │   │   │   │   ├── auth.test.ts
│   │   │   │   │   ├── data.ts
│   │   │   │   │   └── data.test.ts
│   │   │   │   ├── middleware/        # ミドルウェア
│   │   │   │   │   ├── authenticate.ts
│   │   │   │   │   ├── authenticate.test.ts
│   │   │   │   │   ├── errorHandler.ts
│   │   │   │   │   └── requestLogger.ts
│   │   │   │   ├── plugins/           # Fastifyプラグイン
│   │   │   │   │   ├── cors.ts
│   │   │   │   │   ├── rateLimit.ts
│   │   │   │   │   ├── security.ts
│   │   │   │   │   └── swagger.ts
│   │   │   │   └── schemas/           # リクエスト/レスポンススキーマ
│   │   │   │       ├── auth.ts
│   │   │   │       └── data.ts
│   │   │   │
│   │   │   ├── shared/                # API内共有コード
│   │   │   │   ├── di/                # 依存性注入
│   │   │   │   │   └── container.ts
│   │   │   │   ├── config/            # 設定
│   │   │   │   │   └── env.ts
│   │   │   │   └── adapters/          # 外部サービスアダプター
│   │   │   │       └── supabase-client.ts
│   │   │   │
│   │   │   ├── server.ts              # サーバー設定
│   │   │   └── index.ts               # エントリーポイント
│   │   │
│   │   ├── tests/                     # 統合テスト・E2Eテスト
│   │   │   ├── integration/
│   │   │   │   ├── auth.integration.test.ts
│   │   │   │   └── data.integration.test.ts
│   │   │   └── fixtures/
│   │   │       └── test-data.ts
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── vercel.json
│   │
│   └── web/                           # Vite Webフロントエンド
│       ├── src/
│       │   ├── contexts/              # Webの境界づけられたコンテキスト
│       │   │   └── authentication/    # 認証コンテキスト（Web版）
│       │   │       ├── domain/
│       │   │       │   ├── models/
│       │   │       │   │   ├── WebUser.ts
│       │   │       │   │   └── WebUser.test.ts
│       │   │       │   └── services/
│       │   │       │       ├── AuthService.ts
│       │   │       │       └── AuthService.test.ts
│       │   │       ├── application/
│       │   │       │   ├── useAuth.ts
│       │   │       │   └── useAuth.test.ts
│       │   │       └── infrastructure/
│       │   │           ├── SupabaseAuthClient.ts
│       │   │           └── SupabaseAuthClient.test.ts
│       │   │
│       │   ├── pages/                 # ページコンポーネント
│       │   │   ├── Landing.tsx
│       │   │   ├── Landing.test.tsx
│       │   │   ├── Dashboard.tsx
│       │   │   └── Dashboard.test.tsx
│       │   │
│       │   ├── components/            # UIコンポーネント
│       │   │   ├── AuthButtons.tsx
│       │   │   ├── AuthButtons.test.tsx
│       │   │   ├── LogoutButton.tsx
│       │   │   └── LogoutButton.test.tsx
│       │   │
│       │   ├── services/              # APIクライアント
│       │   │   ├── api-client.ts
│       │   │   └── api-client.test.ts
│       │   │
│       │   ├── App.tsx
│       │   └── main.tsx
│       │
│       ├── tests/                     # E2Eテスト
│       │   └── e2e/
│       │       ├── auth.spec.ts
│       │       └── navigation.spec.ts
│       │
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── vitest.config.ts
│       └── playwright.config.ts
│
├── packages/                          # 共有パッケージ
│   ├── shared-kernel/                 # 最小限の共有（DDDのShared Kernel）
│   │   ├── src/
│   │   │   ├── value-objects/         # 基本的な値オブジェクト
│   │   │   │   ├── UserId.ts
│   │   │   │   ├── UserId.test.ts
│   │   │   │   ├── Email.ts
│   │   │   │   ├── Email.test.ts
│   │   │   │   ├── UserTier.ts
│   │   │   │   └── UserTier.test.ts
│   │   │   ├── types/                 # 基本型定義
│   │   │   │   └── base.ts
│   │   │   └── exceptions/            # 基本例外
│   │   │       ├── DomainException.ts
│   │   │       └── ValidationException.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── libs/                          # 技術的なライブラリ（ドメインではない）
│       ├── types/                     # TypeScript型定義・DTO
│       │   ├── src/
│       │   │   ├── api/               # APIレスポンス型
│       │   │   │   ├── auth.ts
│       │   │   │   └── data.ts
│       │   │   ├── dto/               # データ転送オブジェクト
│       │   │   │   └── user.ts
│       │   │   └── errors/            # エラー型定義
│       │   │       └── api-errors.ts
│       │   ├── package.json
│       │   └── tsconfig.json
│       │
│       ├── validation/                # 共通バリデーション
│       │   ├── src/
│       │   │   ├── schemas/           # Zodスキーマ
│       │   │   │   ├── auth.ts
│       │   │   │   ├── auth.test.ts
│       │   │   │   ├── data.ts
│       │   │   │   └── data.test.ts
│       │   │   └── rules/             # カスタムルール
│       │   │       ├── email.ts
│       │   │       └── email.test.ts
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   └── vitest.config.ts
│       │
│       └── utils/                     # 汎用ユーティリティ
│           ├── src/
│           │   ├── date/              # 日付処理
│           │   │   ├── format.ts
│           │   │   └── format.test.ts
│           │   ├── env/               # 環境変数管理
│           │   │   ├── index.ts
│           │   │   └── index.test.ts
│           │   └── constants/         # 定数
│           │       └── index.ts
│           ├── package.json
│           ├── tsconfig.json
│           └── vitest.config.ts
│
├── data/                              # オープンデータファイル
│   ├── secure/
│   │   └── 319985/
│   │       └── r5.json
│   └── public/
│
├── database/                          # データベース関連
│   ├── migrations/                    # マイグレーションファイル
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_setup_rate_limit.sql
│   │   └── 003_custom_access_token_hook.sql
│   └── seeds/                         # シードデータ
│       └── development.sql
│
├── scripts/                           # ビルド・ユーティリティスクリプト
│   ├── generate-openapi.ts           # OpenAPI仕様生成
│   ├── build-docs.ts                 # 静的ドキュメント生成
│   ├── migrate.ts                    # DBマイグレーション
│   └── setup.sh                      # セットアップスクリプト
│
├── docs/                              # プロジェクトドキュメント
│   ├── architecture/                  # アーキテクチャ関連
│   ├── api/                          # API仕様書
│   ├── guides/                       # 開発ガイド
│   └── specs/                        # 仕様書
│
├── dist/                              # ビルド成果物（gitignore対象）
│   ├── api/
│   ├── web/
│   ├── openapi.json
│   └── api-docs.html
│
├── .github/                           # GitHub設定
│   ├── workflows/
│   │   └── ci.yml
│   └── ISSUE_TEMPLATE/
│       └── task.md
│
├── .husky/                            # Git hooks
│   ├── pre-commit
│   └── commit-msg
│
├── .vscode/                           # VSCode設定
│   ├── settings.json
│   └── extensions.json
│
├── pnpm-workspace.yaml                # pnpmワークスペース設定
├── turbo.json                         # Turborepo設定
├── .env.example                       # 環境変数サンプル
├── .eslintrc.js                       # ESLint設定
├── .prettierrc                        # Prettier設定
├── .prettierignore                    # Prettier除外設定
├── .gitignore                         # Git除外設定
├── package.json                       # ルートパッケージ
├── tsconfig.base.json                 # 共通TypeScript設定
├── tsconfig.json                      # ルートTypeScript設定
├── README.md                          # プロジェクトREADME
└── LICENSE                            # ライセンスファイル
```

## 設計の詳細

### 境界づけられたコンテキストの配置

#### 各アプリケーション固有のコンテキスト

```
apps/api/src/contexts/
├── api-management/      # レート制限、APIエンドポイント管理
├── authentication/      # JWT認証、トークン管理
└── data-provision/      # データ提供、ファイルアクセス

apps/web/src/contexts/
└── authentication/      # セッション管理、ユーザー状態
```

**原則**: 各コンテキストは独立し、他のコンテキストのドメインモデルを直接参照しない

#### Shared Kernel（最小限の共有）

```
packages/shared-kernel/src/
├── value-objects/       # UserId, Email, UserTier
├── types/              # 基本型定義
└── exceptions/         # 基本例外クラス
```

**原則**: ビジネスロジックは含まず、安定した基本概念のみ

### テスト配置戦略

#### 1. ユニットテスト（*.test.ts）
- **配置**: ソースコードと同じディレクトリ
- **利点**: インポートパスが短い、リファクタリング時に一緒に移動

#### 2. 統合テスト
- **配置**: `apps/*/tests/integration/`
- **目的**: 複数のモジュール間の連携をテスト

#### 3. E2Eテスト
- **配置**: `apps/web/tests/e2e/`
- **ツール**: Playwright
- **目的**: ユーザーシナリオの検証

### 依存関係の管理

```typescript
// apps/api/src/contexts/authentication/domain/models/ApiUser.ts
import { UserId, Email } from '@nara-opendata/shared-kernel/value-objects';

// コンテキスト間の連携は明示的なインターフェース経由
// apps/api/src/contexts/data-provision/application/DataRetrievalUseCase.ts
export interface IAuthenticationContext {
  getCurrentUser(): Promise<{ userId: UserId; tier: UserTier }>;
}
```

### パッケージ構成

```json
// pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'packages/libs/*'
```

## この構造の利点

1. **DDDの原則に忠実**
   - 各境界づけられたコンテキストが独立
   - 共有は最小限（Shared Kernel）
   - ユビキタス言語の境界が明確

2. **保守性と拡張性**
   - 新しいコンテキストの追加が容易
   - 各コンテキストが独立して進化可能
   - テストがコードと共に管理される

3. **開発効率**
   - Turborepoによる高速ビルド
   - TypeScriptの型安全性
   - 明確なディレクトリ構造

4. **将来への対応**
   - マイクロサービス化への移行パスが明確
   - 新しいアプリケーションの追加が容易
   - 技術スタックの変更に柔軟に対応

## 開発ガイドライン

### 新しいコンテキストの追加

1. 該当アプリケーションの`contexts/`ディレクトリに作成
2. domain, application, infrastructureの3層構造を維持
3. 他のコンテキストとの連携は明示的なインターフェース経由

### 共有コードの判断基準

**Shared Kernelに置くべきもの**:
- システム全体で同じ意味を持つ識別子（UserId等）
- 基本的な値オブジェクト（Email、Money等）
- 変更頻度が極めて低い概念

**各コンテキストに置くべきもの**:
- ビジネスロジックを含むエンティティ
- コンテキスト固有の集約
- ドメインサービス

### コーディング規約

- ファイル名: PascalCase（クラス）、kebab-case（その他）
- テストファイル: `*.test.ts`
- インポート順序: 外部 → shared-kernel → libs → 内部

## まとめ

この構造により、DDDの原則に忠実でありながら、モダンなTypeScriptモノレポのベストプラクティスを適用した、保守性と拡張性の高いシステムを構築できます。各アプリケーションが独自のコンテキストを持つことで、真の意味での境界づけられたコンテキストを実現し、将来の変更に柔軟に対応できる設計となっています。