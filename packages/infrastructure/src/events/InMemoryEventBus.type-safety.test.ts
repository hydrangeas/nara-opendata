import { describe, it, expect, vi } from 'vitest';
import { InMemoryEventBus } from './InMemoryEventBus';
import type { IEventHandler } from '@nara-opendata/shared-kernel';
import { TestEvent, TypedTestEvent } from './test/TestEventMap';
import type { AnotherTestEvent } from './test/TestEventMap';

describe('InMemoryEventBus 型安全性テスト', () => {
  it('正しいイベント型のハンドラーのみ登録できる', () => {
    const eventBus = new InMemoryEventBus();

    // 正しい型のハンドラー
    const testHandler: IEventHandler<TestEvent> = {
      handle: vi.fn(),
      getEventName: () => 'TestEvent',
    };

    // 間違った型のハンドラー
    const wrongHandler: IEventHandler<AnotherTestEvent> = {
      handle: vi.fn(),
      getEventName: () => 'AnotherTestEvent',
    };

    // 正しい登録はコンパイルエラーにならない
    eventBus.subscribe('TestEvent', testHandler);

    // 間違った登録はTypeScriptのコンパイル時にエラーになる
    // @ts-expect-error - 型が一致しないためエラーになることを確認
    eventBus.subscribe('TestEvent', wrongHandler);

    expect(true).toBe(true); // テストが実行されることを確認
  });

  it('イベント名の型チェックが機能する', () => {
    const eventBus = new InMemoryEventBus();
    const handler: IEventHandler<TestEvent> = {
      handle: vi.fn(),
      getEventName: () => 'TestEvent',
    };

    // 正しいイベント名
    eventBus.subscribe('TestEvent', handler);

    // 存在しないイベント名はTypeScriptのコンパイル時にエラーになる
    // @ts-expect-error - 存在しないイベント名でエラーになることを確認
    eventBus.subscribe('NonExistentEvent', handler);

    expect(true).toBe(true);
  });

  it('publishメソッドも型安全である', async () => {
    const eventBus = new InMemoryEventBus();

    // 正しいイベント型
    const testEvent = new TestEvent('test');
    await eventBus.publish(testEvent);

    // 型定義されていないイベントを作成してもpublishできる
    // （DomainEventインターフェースを実装していれば）
    const customEvent = {
      eventId: 'custom-id',
      eventName: 'CustomEvent' as const,
      occurredAt: new Date(),
      eventVersion: 1,
      toJSON: () => ({}),
    };

    // @ts-expect-error - DomainEventMapに登録されていないイベント
    await eventBus.publish(customEvent);

    expect(true).toBe(true);
  });

  it('複雑な型を持つイベントも正しく処理される', async () => {
    const eventBus = new InMemoryEventBus();
    const handler: IEventHandler<TypedTestEvent> = {
      handle: vi.fn(),
      getEventName: () => 'TypedTestEvent',
    };

    eventBus.subscribe('TypedTestEvent', handler);

    const event = new TypedTestEvent({ message: 'test', count: 42 });
    await eventBus.publish(event);

    expect(handler.handle).toHaveBeenCalledWith(event);
  });

  it('unsubscribeも型安全である', () => {
    const eventBus = new InMemoryEventBus();
    const testHandler: IEventHandler<TestEvent> = {
      handle: vi.fn(),
      getEventName: () => 'TestEvent',
    };
    const anotherHandler: IEventHandler<AnotherTestEvent> = {
      handle: vi.fn(),
      getEventName: () => 'AnotherTestEvent',
    };

    eventBus.subscribe('TestEvent', testHandler);
    eventBus.subscribe('AnotherTestEvent', anotherHandler);

    // 正しい組み合わせ
    eventBus.unsubscribe('TestEvent', testHandler);
    eventBus.unsubscribe('AnotherTestEvent', anotherHandler);

    // 間違った組み合わせはTypeScriptのコンパイル時にエラーになる
    // @ts-expect-error - ハンドラーの型が一致しないためコンパイルエラーになることを確認
    eventBus.unsubscribe('TestEvent', anotherHandler);

    // @ts-expect-error - ハンドラーの型が一致しないためコンパイルエラーになることを確認
    eventBus.unsubscribe('AnotherTestEvent', testHandler);

    expect(true).toBe(true);
  });
});
