# Event Bus Infrastructure

このモジュールは、ドメインイベントの発行と配信を管理するイベントバスの実装を提供します。

## 概要

`InMemoryEventBus`は、ドメイン駆動設計（DDD）におけるイベント駆動アーキテクチャをサポートするための軽量なイベントバス実装です。

### 主な特徴

- **遅延ディスパッチ**: イベントは現在の実行コンテキストが終了してから配信されます
- **エラー分離**: 個別のハンドラーでエラーが発生しても他のハンドラーは実行されます
- **重複防止**: 同じハンドラーインスタンスは重複登録されません
- **設定可能な制限**: サイクル数、イベント数、タイムアウトを設定可能
- **型安全**: TypeScriptの型システムを活用した安全な実装

## 使用方法

### 基本的な使用例

```typescript
import { InMemoryEventBus } from '@nara-opendata/infrastructure';
import type { IEventHandler, DomainEvent } from '@nara-opendata/shared-kernel';

// イベントクラスの定義
class UserCreatedEvent implements DomainEvent {
  readonly eventId = crypto.randomUUID();
  readonly eventName = 'UserCreated';
  readonly occurredAt = new Date();
  readonly eventVersion = 1;

  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}

  toJSON() {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      eventVersion: this.eventVersion,
      userId: this.userId,
      email: this.email,
    };
  }
}

// イベントハンドラーの定義
class SendWelcomeEmailHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    console.log(`Sending welcome email to ${event.email}`);
    // メール送信ロジック
  }

  getEventName(): string {
    return 'UserCreated';
  }
}

// 使用例
const eventBus = new InMemoryEventBus();
const handler = new SendWelcomeEmailHandler();

// ハンドラーを登録
eventBus.subscribe('UserCreated', handler);

// イベントを発行
const event = new UserCreatedEvent('user-123', 'user@example.com');
await eventBus.publish(event);

// 不要になったらハンドラーを解除
eventBus.unsubscribe('UserCreated', handler);
```

### カスタム設定での使用

```typescript
import { InMemoryEventBus, IEventBusConfig } from '@nara-opendata/infrastructure';
import { ConsoleLogger } from '@nara-opendata/infrastructure';

const config: IEventBusConfig = {
  maxDispatchCycles: 5, // 最大ディスパッチサイクル数
  maxEventsPerCycle: 100, // 1サイクルあたりの最大イベント数
  handlerTimeoutMs: 5000, // ハンドラーのタイムアウト（ミリ秒）
  debugMode: true, // デバッグログを有効化
};

const logger = new ConsoleLogger('MyApp');
const eventBus = new InMemoryEventBus(config, logger);
```

### 複数イベントの一括発行

```typescript
const events = [
  new UserCreatedEvent('user-1', 'user1@example.com'),
  new UserCreatedEvent('user-2', 'user2@example.com'),
  new UserCreatedEvent('user-3', 'user3@example.com'),
];

await eventBus.publishAll(events);
```

## 設定オプション

| オプション          | 型      | デフォルト値 | 説明                                                                                       |
| ------------------- | ------- | ------------ | ------------------------------------------------------------------------------------------ |
| `maxDispatchCycles` | number  | 10           | イベントハンドラー内で新しいイベントが発行される場合の無限ループを防ぐための最大サイクル数 |
| `maxEventsPerCycle` | number  | 1000         | メモリ使用量を制限するための1サイクルあたりの最大イベント数                                |
| `handlerTimeoutMs`  | number  | 30000        | 個別のイベントハンドラーの実行タイムアウト（ミリ秒）                                       |
| `debugMode`         | boolean | false        | デバッグログの出力を有効化                                                                 |

## エラーハンドリング

### EventBusError

イベントバス固有のエラーは`EventBusError`としてスローされます：

```typescript
import { EventBusError, EventBusErrorType } from '@nara-opendata/infrastructure';

try {
  await eventBus.publish(event);
} catch (error) {
  if (error instanceof EventBusError) {
    switch (error.type) {
      case EventBusErrorType.MAX_CYCLES_EXCEEDED:
        console.error('イベントの連鎖が深すぎます');
        break;
      case EventBusErrorType.MAX_EVENTS_EXCEEDED:
        console.error('イベント数が多すぎます');
        break;
      case EventBusErrorType.HANDLER_TIMEOUT:
        console.error('ハンドラーがタイムアウトしました');
        break;
      case EventBusErrorType.HANDLER_ERROR:
        console.error('ハンドラーでエラーが発生しました', error.cause);
        break;
    }
  }
}
```

### ハンドラーのエラー処理

個別のハンドラーでエラーが発生しても、他のハンドラーの実行は継続されます：

```typescript
class ErrorProneHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    throw new Error('Something went wrong!');
  }

  getEventName(): string {
    return 'UserCreated';
  }
}

class ResilientHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    console.log('This handler will still execute');
  }

  getEventName(): string {
    return 'UserCreated';
  }
}

eventBus.subscribe('UserCreated', new ErrorProneHandler());
eventBus.subscribe('UserCreated', new ResilientHandler());

// ErrorProneHandlerでエラーが発生しても、ResilientHandlerは実行される
await eventBus.publish(new UserCreatedEvent('user-123', 'user@example.com'));
```

## パフォーマンス特性

- **ハンドラー検索**: O(1) - イベント名でのハッシュマップ検索
- **イベント発行**: O(n) - nはハンドラー数
- **メモリ使用量**: ハンドラー数とペンディングイベント数に比例

### パフォーマンスのヒント

1. **適切な設定値を使用**: アプリケーションの特性に応じて`maxEventsPerCycle`と`maxDispatchCycles`を調整
2. **不要なハンドラーは解除**: メモリリークを防ぐため、使用しなくなったハンドラーは必ず`unsubscribe`
3. **デバッグモードは本番環境で無効化**: `debugMode: false`でパフォーマンスを向上

## メモリ管理

### ハンドラーのライフサイクル

```typescript
class Component {
  private handler: IEventHandler<UserCreatedEvent>;
  private eventBus: InMemoryEventBus;

  constructor(eventBus: InMemoryEventBus) {
    this.eventBus = eventBus;
    this.handler = new SendWelcomeEmailHandler();
  }

  onMount() {
    // コンポーネントの初期化時にハンドラーを登録
    this.eventBus.subscribe('UserCreated', this.handler);
  }

  onUnmount() {
    // コンポーネントの破棄時にハンドラーを解除
    this.eventBus.unsubscribe('UserCreated', this.handler);
  }
}
```

### すべてのハンドラーをクリア

```typescript
// テストの後処理などで使用
eventBus.clearAllHandlers();
```

## 高度な使用例

### イベントの連鎖

```typescript
class OrderPlacedHandler implements IEventHandler<OrderPlacedEvent> {
  constructor(private eventBus: InMemoryEventBus) {}

  async handle(event: OrderPlacedEvent): Promise<void> {
    // 注文処理のロジック

    // 新しいイベントを発行
    await this.eventBus.publish(new PaymentRequestedEvent(event.orderId));
  }

  getEventName(): string {
    return 'OrderPlaced';
  }
}
```

### 条件付きハンドラー

```typescript
class ConditionalHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    // 特定の条件でのみ処理を実行
    if (event.email.endsWith('@vip.example.com')) {
      console.log('VIP user detected!');
      // VIP用の特別な処理
    }
  }

  getEventName(): string {
    return 'UserCreated';
  }
}
```

## テスト

### モックを使用したテスト

```typescript
import { vi } from 'vitest';

describe('UserService', () => {
  it('should publish UserCreatedEvent', async () => {
    const mockEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      publishAll: vi.fn(),
      clearAllHandlers: vi.fn(),
    };

    const userService = new UserService(mockEventBus);
    await userService.createUser('user@example.com');

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'UserCreated',
        email: 'user@example.com',
      }),
    );
  });
});
```

## 注意事項

1. **シングルスレッド環境専用**: この実装はNode.jsのようなシングルスレッド環境を想定しています
2. **永続化なし**: イベントはメモリ内にのみ保存され、アプリケーションの再起動で失われます
3. **分散環境非対応**: 複数のインスタンス間でイベントを共有する場合は、RedisやRabbitMQなどの外部メッセージブローカーが必要です

## ライセンス

このコードはプロジェクトのライセンスに従います。
