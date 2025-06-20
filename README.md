# 奈良県オープンデータ提供API

奈良県のオープンデータをJSON形式で提供するWeb APIシステム

## 🏗️ アーキテクチャ

- **モノレポ構成**: pnpm workspaces + Turborepo
- **フロントエンド**: Vite + React + TypeScript
- **バックエンド**: Fastify + TypeScript
- **認証**: Supabase Auth
- **データベース**: Supabase (PostgreSQL)
- **デプロイ**: Vercel

## 📁 プロジェクト構造

```
nara-opendata/
├── apps/
│   ├── api/              # Fastifyバックエンド
│   │   └── src/contexts/ # API固有のコンテキスト（DDD）
│   └── web/              # Viteフロントエンド
│       └── src/contexts/ # Web固有のコンテキスト（DDD）
├── packages/
│   ├── shared-kernel/    # 最小限の共有（値オブジェクト等）
│   └── libs/             # 技術的なライブラリ
│       ├── types/        # TypeScript型定義・DTO
│       ├── validation/   # 共通バリデーション
│       └── utils/        # 汎用ユーティリティ
└── docs/                 # ドキュメント
```

詳細は[ディレクトリ構造ドキュメント](./docs/directory-structure.md)を参照してください。

## 🚀 開発者向けセットアップガイド

### 前提条件

- **Node.js**: v20.0.0以上（推奨: v20.x LTS）
- **pnpm**: v8.0.0以上（`npm install -g pnpm@latest`）
- **Git**: v2.40.0以上
- **VSCode**: 最新版（推奨エディタ）

### 初期セットアップ

#### 1. リポジトリのクローンと依存関係のインストール

```bash
# リポジトリのクローン
git clone https://github.com/your-org/nara-opendata.git
cd nara-opendata

# 依存関係のインストール（初回は時間がかかります）
pnpm install

# Git Hooksのセットアップ
pnpm prepare
```

#### 2. 環境変数の設定

```bash
# 環境変数ファイルのコピー
cp .env.example .env.local

# 各アプリケーション用の環境変数もコピー
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

`.env.local`ファイルを編集して、以下の必須環境変数を設定：

```env
# Supabase設定（https://app.supabase.com でプロジェクトを作成）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT設定（openssl rand -hex 32 で生成）
JWT_SECRET=your-jwt-secret-min-32-chars

# API設定
API_PORT=3000
API_HOST=localhost

# 環境設定
NODE_ENV=development
```

#### 3. VSCode拡張機能のインストール

VSCodeで以下のコマンドを実行するか、拡張機能タブから推奨拡張機能をインストール：

```bash
# コマンドパレット（Ctrl/Cmd + Shift + P）で実行
Extensions: Show Recommended Extensions
```

主要な拡張機能：
- **ESLint**: JavaScriptとTypeScriptのリンティング
- **Prettier**: コードフォーマッター
- **TypeScript Vue Plugin**: TypeScript IntelliSense
- **Error Lens**: エラーのインライン表示
- **GitLens**: Git統合の強化

#### 4. データベースのセットアップ

```bash
# Supabaseのマイグレーション実行
pnpm db:migrate

# 開発用シードデータの投入（オプション）
pnpm db:seed
```

### 開発ワークフロー

#### 開発サーバーの起動

```bash
# すべてのアプリケーションを並行起動（推奨）
pnpm dev

# 個別起動
pnpm dev:api   # http://localhost:3000
pnpm dev:web   # http://localhost:5173

# ログを見やすくする場合
pnpm dev --filter @nara-opendata/api
```

#### コードの品質チェック

```bash
# すべての品質チェックを実行
pnpm check

# 個別実行
pnpm lint        # ESLintチェック
pnpm lint:fix    # ESLint自動修正
pnpm format      # Prettierフォーマット
pnpm type-check  # TypeScript型チェック
```

#### テストの実行

```bash
# すべてのテストを実行
pnpm test

# 監視モードでテスト
pnpm test:watch

# カバレッジ付きテスト
pnpm test:coverage

# E2Eテスト（ブラウザテスト）
pnpm test:e2e
```

### Git Hooksとコミット規約

#### 自動チェック（Husky + lint-staged）

コミット時に以下が自動実行されます：
- **pre-commit**: 変更ファイルのリント＆フォーマット
- **commit-msg**: コミットメッセージの規約チェック

#### コミットメッセージ規約

```bash
# 正しい例
git commit -m "feat: ユーザー認証機能を追加"
git commit -m "fix: APIレート制限のバグを修正"
git commit -m "docs: READMEにセットアップ手順を追加"

# スコープ付きの例
git commit -m "feat(api): データ取得エンドポイントを実装"
git commit -m "fix(web): ログインフォームのバリデーションエラーを修正"
```

タイプ一覧：
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: フォーマットの変更（コードの動作に影響しない）
- `refactor`: リファクタリング
- `perf`: パフォーマンス改善
- `test`: テストの追加・修正
- `build`: ビルドシステムの変更
- `ci`: CI設定の変更
- `chore`: その他の変更

### トラブルシューティング

#### pnpm installでエラーが発生する場合

```bash
# キャッシュをクリア
pnpm store prune

# node_modulesを削除して再インストール
rm -rf node_modules **/node_modules
pnpm install
```

#### TypeScriptエラーが解消されない場合

```bash
# TypeScriptサーバーを再起動
# VSCode: Ctrl/Cmd + Shift + P → "TypeScript: Restart TS Server"

# または手動でビルド
pnpm build --force
```

#### ポートが使用中の場合

```bash
# 使用中のポートを確認
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# プロセスを終了してから再起動
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### 便利なコマンド集

```bash
# 特定パッケージのコマンド実行
pnpm --filter @nara-opendata/api <command>

# 依存関係の更新チェック
pnpm update --interactive --latest

# 未使用の依存関係を検出
pnpm dlx depcheck

# パッケージ間の依存関係を可視化
pnpm dlx madge --circular --extensions ts,tsx ./

# ビルドキャッシュのクリア
pnpm clean
rm -rf .turbo

# プロジェクト全体のサイズ確認
pnpm dlx source-map-explorer apps/web/dist/assets/*.js
```

## 🛠️ 開発

### ビルド

```bash
# すべてをビルド
pnpm build

# 特定のアプリケーションをビルド
pnpm build:api
pnpm build:web

# プロダクションビルド
pnpm build --mode production
```

### テスト

```bash
# すべてのテストを実行
pnpm test

# ユニットテストのみ
pnpm test:unit

# 統合テストのみ
pnpm test:integration

# E2Eテスト
pnpm test:e2e

# 特定ファイルのテスト
pnpm test -- user.test.ts
```

### デバッグ

VSCodeでのデバッグ設定は`.vscode/launch.json`に定義済み：
- **F5**: APIサーバーのデバッグ開始
- **Shift + F5**: デバッグ停止
- **F9**: ブレークポイントの設定/解除

## 🌐 環境

| 環境 | URL | 用途 |
|------|-----|------|
| **local** | http://localhost:3000 (API)<br>http://localhost:5173 (Web) | ローカル開発 |
| **test** | - | 自動テスト実行 |
| **develop** | https://develop-nara-opendata.vercel.app | 開発環境（PR自動デプロイ） |
| **staging** | https://staging-nara-opendata.vercel.app | ステージング環境 |
| **production** | https://nara-opendata.vercel.app | 本番環境 |

## 📝 コーディング規約

### TypeScript/JavaScript

- **ESLint**: 設定は`eslint.config.js`を参照
- **Prettier**: 設定は`.prettierrc`を参照
- **命名規則**:
  - 変数・関数: camelCase
  - 型・インターフェース: PascalCase
  - 定数: UPPER_SNAKE_CASE
  - ファイル名: kebab-case

### React

- 関数コンポーネントを使用
- Custom Hooksは`use`プレフィックス
- Props型は`interface`で定義

### ディレクトリ構造

- 機能別にグループ化（Feature-based）
- 共通コンポーネントは`shared/`に配置
- ドメインロジックは`contexts/`に配置

## 🔗 関連ドキュメント

- [ディレクトリ構造](./docs/directory-structure.md)
- [環境構築ガイド](./docs/environment-setup.md)
- [アーキテクチャ設計](./docs/specs/step5-design.md)
- [TypeScriptガイドライン](./docs/020-csharp guidelines.md)
- [API仕様書](./docs/api/)
- [デプロイメントガイド](./docs/guides/deployment.md)

## 🤝 コントリビューション

1. Issueを作成または既存のIssueを選択
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📄 ライセンス

このプロジェクトは[MIT License](./LICENSE)の下で公開されています。