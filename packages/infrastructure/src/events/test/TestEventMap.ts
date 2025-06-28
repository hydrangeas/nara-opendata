import type { DomainEvent } from '@nara-opendata/shared-kernel';

/**
 * テスト用のイベントクラス
 */
export class TestEvent implements DomainEvent {
  public readonly eventId = 'test-event-id';
  public readonly eventName = 'TestEvent' as const;
  public readonly occurredAt = new Date();
  public readonly eventVersion = 1;

  constructor(public readonly data: string) {}

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      eventVersion: this.eventVersion,
      data: this.data,
    };
  }
}

/**
 * 別のテスト用イベントクラス
 */
export class AnotherTestEvent implements DomainEvent {
  public readonly eventId = 'another-test-event-id';
  public readonly eventName = 'AnotherTestEvent' as const;
  public readonly occurredAt = new Date();
  public readonly eventVersion = 1;

  constructor(public readonly value: number) {}

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      eventVersion: this.eventVersion,
      value: this.value,
    };
  }
}

/**
 * イベント連鎖テスト用イベント
 */
export class ChainStartEvent implements DomainEvent {
  public readonly eventId = 'chain-start-event-id';
  public readonly eventName = 'ChainStartEvent' as const;
  public readonly occurredAt = new Date();
  public readonly eventVersion = 1;

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      eventVersion: this.eventVersion,
    };
  }
}

/**
 * イベント連鎖テスト用イベント
 */
export class ChainEndEvent implements DomainEvent {
  public readonly eventId = 'chain-end-event-id';
  public readonly eventName = 'ChainEndEvent' as const;
  public readonly occurredAt = new Date();
  public readonly eventVersion = 1;

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      eventVersion: this.eventVersion,
    };
  }
}

/**
 * 型推論テスト用イベント
 */
export class TypedTestEvent implements DomainEvent {
  public readonly eventId = 'typed-test-event-id';
  public readonly eventName = 'TypedTestEvent' as const;
  public readonly occurredAt = new Date();
  public readonly eventVersion = 1;

  constructor(public readonly testData: { message: string; count: number }) {}

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      eventVersion: this.eventVersion,
      testData: this.testData,
    };
  }
}

/**
 * ベンチマーク用イベント
 */
export class BenchmarkEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventName = 'BenchmarkEvent' as const;
  public readonly occurredAt = new Date();
  public readonly eventVersion = 1;

  constructor(public readonly index: number) {
    this.eventId = `benchmark-${index}`;
  }

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      eventVersion: this.eventVersion,
      index: this.index,
    };
  }
}

// DomainEventMapを拡張（テスト用）
declare module '@nara-opendata/shared-kernel' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface DomainEventMap {
    TestEvent: TestEvent;
    AnotherTestEvent: AnotherTestEvent;
    ChainStartEvent: ChainStartEvent;
    ChainEndEvent: ChainEndEvent;
    TypedTestEvent: TypedTestEvent;
    BenchmarkEvent: BenchmarkEvent;
  }
}
