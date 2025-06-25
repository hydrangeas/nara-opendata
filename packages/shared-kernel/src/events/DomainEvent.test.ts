import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { DomainEvent } from './DomainEvent';

// テスト用の具体的なDomainEvent実装
class TestDomainEvent extends DomainEvent {
  public readonly eventName = 'TestEvent';

  constructor(
    public readonly testData: string,
    public readonly testNumber: number,
    occurredAt?: Date,
  ) {
    super(occurredAt);
  }

  getEventData(): Record<string, unknown> {
    return {
      testData: this.testData,
      testNumber: this.testNumber,
    };
  }
}

describe('DomainEvent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('イベントIDがUUIDで自動生成される', () => {
    const event1 = new TestDomainEvent('data1', 1);
    const event2 = new TestDomainEvent('data2', 2);

    expect(event1.eventId).toBeDefined();
    expect(event2.eventId).toBeDefined();
    expect(event1.eventId).not.toBe(event2.eventId);

    // UUID v4の形式をチェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(event1.eventId).toMatch(uuidRegex);
    expect(event2.eventId).toMatch(uuidRegex);
  });

  it('発生日時が自動設定される', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    vi.setSystemTime(now);

    const event = new TestDomainEvent('data', 42);

    expect(event.occurredAt).toEqual(now);
  });

  it('発生日時を指定できる', () => {
    const customDate = new Date('2023-12-25T00:00:00Z');
    const event = new TestDomainEvent('data', 42, customDate);

    expect(event.occurredAt).toEqual(customDate);
  });

  it('イベント名が正しく設定される', () => {
    const event = new TestDomainEvent('data', 42);

    expect(event.eventName).toBe('TestEvent');
  });

  it('イベントバージョンがデフォルトで1になる', () => {
    const event = new TestDomainEvent('data', 42);

    expect(event.eventVersion).toBe(1);
  });

  it('getEventDataが正しくデータを返す', () => {
    const event = new TestDomainEvent('test data', 123);

    const data = event.getEventData();

    expect(data).toEqual({
      testData: 'test data',
      testNumber: 123,
    });
  });

  it('toJSONで完全なイベント情報を返す', () => {
    const occurredAt = new Date('2024-01-01T12:00:00Z');
    const event = new TestDomainEvent('test data', 456, occurredAt);

    const json = event.toJSON();

    expect(json).toEqual({
      eventId: event.eventId,
      eventName: 'TestEvent',
      eventVersion: 1,
      occurredAt: '2024-01-01T12:00:00.000Z',
      data: {
        testData: 'test data',
        testNumber: 456,
      },
    });
  });

  it('異なるDomainEvent実装が独立している', () => {
    class AnotherTestEvent extends DomainEvent {
      public readonly eventName = 'AnotherEvent';

      constructor(public readonly value: string) {
        super();
      }

      getEventData(): Record<string, unknown> {
        return { value: this.value };
      }
    }

    const event1 = new TestDomainEvent('data', 100);
    const event2 = new AnotherTestEvent('another data');

    expect(event1.eventName).toBe('TestEvent');
    expect(event2.eventName).toBe('AnotherEvent');
    expect(event1.getEventData()).toEqual({ testData: 'data', testNumber: 100 });
    expect(event2.getEventData()).toEqual({ value: 'another data' });
  });

  it('イベントのプロパティが設定される', () => {
    const event = new TestDomainEvent('data', 42);

    // プロパティが正しく設定されていることを確認
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.eventVersion).toBe(1);
    expect(event.eventName).toBe('TestEvent');

    // TypeScriptの型定義でreadonlyとして保護されているため、
    // コンパイル時に代入は防がれる
  });
});
