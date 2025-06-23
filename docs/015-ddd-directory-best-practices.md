# DDD ディレクトリ構造 ベストプラクティス（TypeScript）

## 概要

本ドキュメントは、TypeScriptプロジェクトにおけるドメイン駆動設計（DDD）のディレクトリ構造に関するベストプラクティスをまとめたものです。実プロジェクトでの経験から得られた教訓を基に、理想と現実のバランスを考慮した実践的なガイドラインを提供します。

## 基本原則

### 1. 明示的な分類
DDDの戦術的パターン（エンティティ、バリューオブジェクト、集約、ドメインサービス等）を明確に分類し、ディレクトリ構造に反映させる。

### 2. 段階的な詳細化
プロジェクトの規模に応じて、シンプルな構造から始めて段階的に詳細化する。

### 3. 一貫性の維持
プロジェクト全体で統一された構造を採用し、開発者の認知負荷を軽減する。

## 推奨ディレクトリ構造

### 小規模プロジェクト（推奨開始時点）

```
src/
└── contexts/                          # 境界づけられたコンテキスト
    └── [context-name]/
        ├── domain/                    # ドメイン層に直接配置
        │   ├── User.entity.ts         # エンティティ
        │   ├── Email.value-object.ts  # バリューオブジェクト
        │   ├── Order.aggregate.ts     # 集約
        │   ├── PricingService.domain-service.ts   # ドメインサービス
        │   ├── OrderPlaced.domain-event.ts       # ドメインイベント
        │   └── IOrderRepository.repository.ts     # リポジトリインターフェース
        ├── application/
        │   ├── use-cases/
        │   └── services/
        └── infrastructure/
            ├── repositories/
            └── adapters/
```

**利点**：
- 最もシンプルな構造
- 不要なネストを避ける
- ファイル数が少ない段階では十分管理可能
- 命名規則でDDDパターンを明示

### 中規模プロジェクト（成長段階）

```
src/
└── contexts/
    └── [context-name]/
        ├── domain/
        │   ├── entities/              # エンティティを分離
        │   │   ├── User.ts
        │   │   └── User.test.ts
        │   ├── value-objects/         # バリューオブジェクトを分離
        │   │   ├── Email.ts
        │   │   ├── Email.test.ts
        │   │   ├── Money.ts
        │   │   └── Money.test.ts
        │   ├── aggregates/            # 集約を明示
        │   │   ├── Order.ts
        │   │   └── Order.test.ts
        │   ├── services/              # ドメインサービス
        │   │   ├── PricingService.ts
        │   │   └── PricingService.test.ts
        │   ├── events/                # ドメインイベント
        │   │   ├── OrderPlaced.ts
        │   │   └── PaymentReceived.ts
        │   └── repositories/          # リポジトリインターフェース
        │       └── IOrderRepository.ts
        ├── application/
        │   ├── use-cases/
        │   │   ├── PlaceOrder.ts
        │   │   └── PlaceOrder.test.ts
        │   ├── services/              # アプリケーションサービス
        │   └── dto/                   # データ転送オブジェクト
        └── infrastructure/
            ├── repositories/           # リポジトリ実装
            │   ├── OrderRepository.ts
            │   └── OrderRepository.test.ts
            └── adapters/               # 外部サービスアダプター
```

**利点**：
- DDDパターンが明確に分類される
- 各概念の責務が明確
- テストの配置が直感的

### 大規模プロジェクト（エンタープライズ）

```
src/
├── bounded-contexts/                  # 最上位で境界づけられたコンテキストを分離
│   ├── ordering/                      # 注文コンテキスト
│   │   ├── domain/
│   │   │   ├── aggregates/           # 集約（中規模と同じ構造を維持）
│   │   │   │   ├── order/           # Order集約
│   │   │   │   │   ├── Order.ts     # 集約ルート
│   │   │   │   │   ├── OrderItem.ts # 集約内エンティティ
│   │   │   │   │   ├── OrderStatus.ts # 集約内VO
│   │   │   │   │   ├── OrderNumber.ts # 集約内VO
│   │   │   │   │   └── index.ts
│   │   │   │   └── customer/         # Customer集約
│   │   │   │       ├── Customer.ts   # 集約ルート
│   │   │   │       ├── CustomerProfile.ts
│   │   │   │       └── index.ts
│   │   │   ├── entities/             # 集約に属さない単独エンティティ
│   │   │   │   └── PriceList.ts
│   │   │   ├── value-objects/        # コンテキスト共通のVO
│   │   │   │   ├── DeliveryAddress.ts
│   │   │   │   ├── OrderPriority.ts
│   │   │   │   └── ShippingMethod.ts
│   │   │   ├── services/
│   │   │   │   ├── PricingService.ts
│   │   │   │   └── InventoryCheckService.ts
│   │   │   ├── events/
│   │   │   │   ├── OrderPlaced.ts
│   │   │   │   └── OrderCancelled.ts
│   │   │   ├── repositories/         # リポジトリインターフェース
│   │   │   │   ├── IOrderRepository.ts
│   │   │   │   └── ICustomerRepository.ts
│   │   │   ├── specifications/      # 仕様パターン
│   │   │   │   └── OrderCanBeCancelledSpec.ts
│   │   │   └── exceptions/          # ドメイン例外
│   │   │       └── OrderException.ts
│   │   ├── application/
│   │   └── infrastructure/
│   └── inventory/                    # 在庫コンテキスト
│       ├── domain/
│       │   ├── aggregates/
│       │   │   └── stock/
│       │   │       ├── Stock.ts      # 集約ルート
│       │   │       ├── StockMovement.ts
│       │   │       └── StockLevel.ts # 集約内VO
│       │   ├── value-objects/
│       │   │   ├── SKU.ts            # 在庫管理番号
│       │   │   ├── WarehouseCode.ts
│       │   │   └── ReorderPoint.ts
│       │   └── ...
│       └── ...
└── shared-kernel/                    # 共有カーネル
    ├── domain/
    │   └── value-objects/            # 真に共有されるVOのみ
    │       ├── Money.ts              # 全コンテキストで同じ意味
    │       ├── Email.ts              # 全コンテキストで同じ意味
    │       ├── PhoneNumber.ts
    │       └── UserId.ts
    └── types/
```

### 構造の一貫性について

すべての規模で一貫した構造を保つことが重要です：

| 要素 | 小規模 | 中規模 | 大規模 |
|------|--------|--------|--------|
| エンティティ | domain/User.entity.ts | entities/User.ts | entities/User.ts または aggregates/内 |
| バリューオブジェクト | domain/Email.value-object.ts | value-objects/Email.ts | value-objects/Email.ts または aggregates/内 |
| 集約 | domain/Order.aggregate.ts | aggregates/Order.ts | aggregates/order/Order.ts |
| ドメインサービス | domain/PricingService.domain-service.ts | services/PricingService.ts | services/PricingService.ts |
| ドメインイベント | domain/OrderPlaced.domain-event.ts | events/OrderPlaced.ts | events/OrderPlaced.ts |
| リポジトリ | domain/IOrderRepository.repository.ts | repositories/IOrderRepository.ts | repositories/IOrderRepository.ts |

**重要な原則**：
1. 小規模では`domain/`直下、中規模以降で分類ディレクトリを作成
2. 規模が大きくなっても基本的な分類（entities, value-objects, aggregates, services）の概念は維持
3. 大規模では集約内に複数のファイルが含まれるため、集約ごとにディレクトリを作成

### バリューオブジェクトの配置戦略

#### 1. コンテキスト固有のバリューオブジェクト（大半のケース）

**配置場所**：各境界づけられたコンテキスト内

```typescript
// bounded-contexts/ordering/domain/value-objects/DeliveryAddress.ts
export class DeliveryAddress {
  // 注文コンテキスト特有の配送先住所の表現
  constructor(
    private readonly street: string,
    private readonly city: string,
    private readonly postalCode: string,
    private readonly instructions?: string  // 配送指示
  ) {}
}

// bounded-contexts/inventory/domain/value-objects/WarehouseCode.ts
export class WarehouseCode {
  // 在庫コンテキスト特有の倉庫コード
  constructor(private readonly value: string) {
    if (!value.match(/^WH-[0-9]{4}$/)) {
      throw new Error('Invalid warehouse code format');
    }
  }
}
```

#### 2. 真に共有されるバリューオブジェクト（少数）

**配置場所**：shared-kernel

```typescript
// shared-kernel/domain/value-objects/Money.ts
export class Money {
  // すべてのコンテキストで同じ意味・同じ振る舞い
  constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {}
}
```

### 判断基準

**shared-kernelに置くべきもの**：
- システム全体で完全に同じ意味を持つ
- 変更頻度が極めて低い
- ビジネスロジックをほとんど含まない
- 例：Money, Email, PhoneNumber, UserId

**各コンテキストに置くべきもの**：
- コンテキスト特有の意味や振る舞いを持つ
- コンテキストによって微妙に異なる可能性がある
- ビジネスルールを含む
- 例：DeliveryAddress（注文用）vs WarehouseAddress（在庫用）

## 移行戦略

### 1. 段階的移行アプローチ

```typescript
// Step 1: 命名規則から始める
// Before: domain/User.ts
// After:  domain/User.entity.ts

// Step 2: 主要な分類から分離
// domain/User.entity.ts → entities/User.ts
// domain/Email.value-object.ts → value-objects/Email.ts

// Step 3: 集約単位で整理
// aggregates/Order.ts → aggregates/order/Order.ts
// aggregates/Order.ts → aggregates/order/OrderItem.ts
```

### 2. 移行時の考慮事項

- **インポートパスの管理**：パスエイリアスを活用
- **段階的なリファクタリング**：一度にすべてを変更しない
- **チームの合意形成**：変更前に方針を共有

## ファイル命名規則

### 基本規則

| DDDパターン | ファイル名 | 例 |
|------------|----------|-----|
| エンティティ | PascalCase.ts | User.ts |
| バリューオブジェクト | PascalCase.ts | Email.ts |
| 集約 | PascalCase.ts | Order.ts |
| ドメインサービス | PascalCase.ts | PricingService.ts |
| リポジトリインターフェース | IPascalCase.ts | IUserRepository.ts |
| ドメインイベント | PascalCase.ts | OrderPlaced.ts |

### 拡張命名規則（小規模プロジェクト用）

小規模プロジェクトではファイル名のサフィックスで分類を明示します：

```
User.entity.ts                 # エンティティ
Email.value-object.ts          # バリューオブジェクト  
Order.aggregate.ts             # 集約
PricingService.domain-service.ts # ドメインサービス
OrderPlaced.domain-event.ts    # ドメインイベント
IUserRepository.repository.ts  # リポジトリインターフェース
```

**フルネーム採用の理由**：
1. **明確性**: 誰が見ても即座に理解できる
2. **検索性**: "value-object"で検索可能
3. **業界標準**: TypeScriptエコシステムではフルネームが一般的
4. **IDE対応**: 自動補完により長さは問題にならない
5. **新規参入者に優しい**: 学習コストが低い

**注意点**：
- `domain-event.ts` と `domain-service.ts` は "domain-" プレフィックスを含む
- これにより、applicationサービスやインフラのイベントと区別できる

### なぜフルネームサフィックスを推奨するのか

**TypeScriptコミュニティの慣習との整合性**：
```typescript
// Angular
app.component.ts
app.service.ts
app.module.ts

// NestJS  
user.controller.ts
user.service.ts
user.module.ts

// DDD with TypeScript（推奨）
User.entity.ts
Email.value-object.ts
Order.aggregate.ts
```

**略語の問題点**：
- `.vo.ts` → "View Object"? "Value Object"? 
- `.ds.ts` → "Data Source"? "Domain Service"?
- `.agg.ts` → 直感的でない

**メリット**：
- **grep/検索**: `find . -name "*.value-object.ts"` で簡単に検索
- **新人教育**: ファイル名を見るだけでDDDパターンを学習
- **IDE**: 自動インポート時に種別が明確

## TypeScript固有の考慮事項

### 1. ブランド型の活用

```typescript
// value-objects/UserId.ts
export type UserId = string & { readonly brand: unique symbol };

export function createUserId(value: string): UserId {
  // バリデーション
  return value as UserId;
}
```

### 2. インターフェースの配置

```typescript
// domain/repositories/IUserRepository.ts（推奨）
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
}

// infrastructure/repositories/UserRepository.ts
export class UserRepository implements IUserRepository {
  // 実装
}
```

### 3. バレルエクスポート（index.ts）の活用

```typescript
// domain/models/order/index.ts
export { Order } from './Order';
export { OrderItem } from './OrderItem';
export { OrderStatus } from './OrderStatus';
export type { OrderId } from './OrderId';
```

## アンチパターンと回避策

### 1. 過度な分類

**アンチパターン**：
```
domain/
├── entities/
│   └── base/
│       └── abstract/
│           └── implementations/
│               └── User.ts  // 深すぎる
```

**推奨**：
```
domain/
├── entities/
│   └── User.ts  // シンプルに
```

### 2. 技術的関心事での分類

**アンチパターン**：
```
domain/
├── classes/      # 技術的分類
├── interfaces/
└── types/
```

**推奨**：
```
domain/
├── entities/     # ビジネス概念で分類
├── value-objects/
└── services/
```

### 3. 共有カーネルの肥大化

**アンチパターン**：
```typescript
// shared-kernel に配置（誤り）
export class OrderCalculationService {
  // ビジネスロジックを含む
}
```

**推奨**：
```typescript
// shared-kernel（正しい）
export type Money = { amount: number; currency: string };

// contexts/ordering/domain/services（正しい）
export class OrderCalculationService {
  // コンテキスト固有のロジック
}
```

## 実装チェックリスト

### プロジェクト開始時
- [ ] プロジェクト規模の見積もり
- [ ] 初期ディレクトリ構造の選択
- [ ] 命名規則の確認（フルネーム推奨）
- [ ] チームへの共有

### 成長段階
- [ ] ファイル数の監視（domain/に20ファイル以上で分離検討）
- [ ] DDDパターンの明確化が必要か評価
- [ ] 段階的移行計画の作成

### リファクタリング時
- [ ] 影響範囲の特定
- [ ] インポートパスの更新計画
- [ ] テストの同時移行
- [ ] ドキュメントの更新

## まとめ

### 重要なポイント

1. **完璧を求めない**：プロジェクトの規模と段階に応じた構造を選択
2. **段階的な進化**：小さく始めて、必要に応じて詳細化
3. **一貫性優先**：部分的に理想的な構造より、全体の一貫性を重視
4. **実用性重視**：DDDの原則を守りつつ、開発効率も考慮
5. **可読性重視**：フルネームサフィックスで明確な意図を伝える

### 推奨アプローチ

1. 新規プロジェクト：小規模構造から開始
2. 既存プロジェクト：命名規則の導入から開始
3. 大規模化時：計画的な移行を実施

DDDは設計思想であり、ディレクトリ構造はその表現の一つに過ぎません。チームの理解度とプロジェクトの要求に応じて、適切なバランスを見つけることが成功の鍵です。