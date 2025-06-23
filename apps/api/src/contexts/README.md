# DDD ディレクトリ構造

このプロジェクトは中規模プロジェクトとして、ドメイン駆動設計（DDD）のベストプラクティスに従ったディレクトリ構造を採用しています。

## ディレクトリ構造

```
contexts/
├── authentication/        # 認証コンテキスト
│   ├── domain/
│   │   ├── entities/      # エンティティ
│   │   ├── value-objects/ # バリューオブジェクト
│   │   ├── aggregates/    # 集約
│   │   ├── services/      # ドメインサービス
│   │   ├── events/        # ドメインイベント
│   │   └── repositories/  # リポジトリインターフェース
│   ├── application/       # アプリケーション層
│   └── infrastructure/    # インフラストラクチャ層
├── api/                   # APIコンテキスト
├── data/                  # データコンテキスト
└── log/                   # ログコンテキスト
```

## 各ディレクトリの説明

### domain/entities/

- エンティティ（Entity）を配置
- 識別子を持ち、ライフサイクルを通じて同一性を保つオブジェクト

### domain/value-objects/

- バリューオブジェクト（Value Object）を配置
- 識別子を持たず、属性の組み合わせで等価性が決まるオブジェクト
- 例：AuthenticatedUser, RateLimit

### domain/aggregates/

- 集約（Aggregate）を配置
- 関連するオブジェクトのまとまりで、一貫性境界を形成

### domain/services/

- ドメインサービス（Domain Service）を配置
- 特定のエンティティやバリューオブジェクトに属さないビジネスロジック
- 例：AuthenticationService

### domain/events/

- ドメインイベント（Domain Event）を配置
- ドメイン内で発生した重要なビジネス上の出来事

### domain/repositories/

- リポジトリインターフェース（Repository Interface）を配置
- 集約の永続化と取得のためのインターフェース

## 命名規則

- **エンティティ**: PascalCase.ts (例: User.ts)
- **バリューオブジェクト**: PascalCase.ts (例: Email.ts)
- **集約**: PascalCase.ts (例: Order.ts)
- **ドメインサービス**: PascalCase.ts (例: PricingService.ts)
- **リポジトリインターフェース**: IPascalCase.ts (例: IUserRepository.ts)
- **ドメインイベント**: PascalCase.ts (例: OrderPlaced.ts)

## 参考資料

詳細は `/docs/015-ddd-directory-best-practices.md` を参照してください。
