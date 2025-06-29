/**
 * DIコンテナのテストヘルパー
 *
 * テスト時にDIコンテナのセットアップとクリーンアップを行うユーティリティです。
 */

import 'reflect-metadata';
import { initializeContainer, resetContainer } from '../container';
import { TYPES } from '../types/di';
import type {
  ILogger,
  IEventBus,
  IEventHandler,
  DomainEvent,
  EventName,
  EventType,
} from '@nara-opendata/shared-kernel';
import type { IOpenDataRepository } from '../contexts/data/domain/repositories/IOpenDataRepository';
import type { IRateLimitRepository } from '../contexts/api/domain/repositories/IRateLimitRepository';
import type { IAPILogRepository } from '../contexts/log/domain/repositories/IAPILogRepository';
import type { IAuthLogRepository } from '../contexts/log/domain/repositories/IAuthLogRepository';
import type { IAPIEndpointRepository } from '../contexts/api/domain/repositories/IAPIEndpointRepository';

/**
 * モックロガーの実装
 *
 * @remarks
 * テスト時のログ出力を抑制するモック実装
 */
export class MockLogger implements ILogger {
  private logs = {
    info: [] as { message: string; meta?: Record<string, unknown> }[],
    warn: [] as { message: string; meta?: Record<string, unknown> }[],
    error: [] as { message: string; error?: Error | unknown; meta?: Record<string, unknown> }[],
    debug: [] as { message: string; meta?: Record<string, unknown> }[],
  };

  info(message: string, meta?: Record<string, unknown>): void {
    this.logs.info.push(meta !== undefined ? { message, meta } : { message });
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logs.warn.push(meta !== undefined ? { message, meta } : { message });
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const entry: { message: string; error?: Error | unknown; meta?: Record<string, unknown> } = {
      message,
    };
    if (error !== undefined) entry.error = error;
    if (meta !== undefined) entry.meta = meta;
    this.logs.error.push(entry);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logs.debug.push(meta !== undefined ? { message, meta } : { message });
  }

  getLogs(): {
    info: { message: string; meta?: Record<string, unknown> }[];
    warn: { message: string; meta?: Record<string, unknown> }[];
    error: { message: string; error?: Error | unknown; meta?: Record<string, unknown> }[];
    debug: { message: string; meta?: Record<string, unknown> }[];
  } {
    return this.logs;
  }

  clear(): void {
    this.logs = {
      info: [],
      warn: [],
      error: [],
      debug: [],
    };
  }
}

/**
 * モックイベントバスの実装
 *
 * @remarks
 * テスト時のイベント発行を記録するモック実装
 */
export class MockEventBus implements IEventBus {
  private publishedEvents: DomainEvent[] = [];
  private handlers = new Map<string, IEventHandler<DomainEvent>[]>();

  async publish<K extends EventName>(event: EventType<K>): Promise<void> {
    this.publishedEvents.push(event);
    const eventHandlers = this.handlers.get(event.eventName) || [];
    await Promise.all(eventHandlers.map((handler) => handler.handle(event)));
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }

  subscribe<K extends EventName>(eventName: K, handler: IEventHandler<EventType<K>>): void {
    const handlers = this.handlers.get(eventName as string) || [];
    handlers.push(handler as IEventHandler<DomainEvent>);
    this.handlers.set(eventName as string, handlers);
  }

  unsubscribe<K extends EventName>(eventName: K, handler: IEventHandler<EventType<K>>): void {
    const handlers = this.handlers.get(eventName as string);
    if (!handlers) return;

    const index = handlers.indexOf(handler as IEventHandler<DomainEvent>);
    if (index !== -1) {
      handlers.splice(index, 1);
    }

    if (handlers.length === 0) {
      this.handlers.delete(eventName as string);
    }
  }

  clearAllHandlers(): void {
    this.handlers.clear();
  }

  getPublishedEvents(): readonly DomainEvent[] {
    return this.publishedEvents;
  }

  clearPublishedEvents(): void {
    this.publishedEvents = [];
  }
}

/**
 * モックリポジトリの作成ヘルパー
 */
function createMockRepository<T>(): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy({} as any, {
    get(_, prop) {
      if (typeof prop === 'string') {
        return async () => {
          // Mock implementation that returns appropriate values
          if (prop === 'findById' || prop === 'findByCondition') {
            return null;
          }
          if (prop === 'findAll' || prop === 'findRecentByUserId') {
            return [];
          }
          if (prop === 'countByUserIdWithinWindow') {
            return 0;
          }
          if (prop === 'save' || prop === 'update' || prop === 'delete') {
            return undefined;
          }
          return undefined;
        };
      }
      return undefined;
    },
  });
}

/**
 * テスト用のDIコンテナセットアップ
 *
 * @remarks
 * テスト環境用のモック実装でコンテナを初期化します
 */
export function setupTestContainer(): void {
  // コンテナをリセット
  resetContainer();

  // シングルトンインスタンスを作成
  const mockLogger = new MockLogger();
  const mockEventBus = new MockEventBus();

  // テストモードで初期化
  initializeContainer({
    isTestMode: true,
    customBindings: [
      {
        token: TYPES.ILogger,
        useValue: mockLogger,
      },
      {
        token: TYPES.IEventBus,
        useValue: mockEventBus,
      },
      // Mock repositories
      {
        token: TYPES.IOpenDataRepository,
        useValue: createMockRepository<IOpenDataRepository>(),
      },
      {
        token: TYPES.IRateLimitRepository,
        useValue: createMockRepository<IRateLimitRepository>(),
      },
      {
        token: TYPES.IAPILogRepository,
        useValue: createMockRepository<IAPILogRepository>(),
      },
      {
        token: TYPES.IAuthLogRepository,
        useValue: createMockRepository<IAuthLogRepository>(),
      },
      {
        token: TYPES.IAPIEndpointRepository,
        useValue: createMockRepository<IAPIEndpointRepository>(),
      },
    ],
  });
}

/**
 * テスト用のDIコンテナクリーンアップ
 *
 * @remarks
 * テスト後にコンテナをクリーンな状態に戻します
 */
export function teardownTestContainer(): void {
  resetContainer();
}

/**
 * モックリポジトリの基底クラス
 *
 * @remarks
 * リポジトリのモック実装を簡単に作成するための基底クラス
 */
export abstract class MockRepository<T> {
  protected items: T[] = [];

  clear(): void {
    this.items = [];
  }

  addItem(item: T): void {
    this.items.push(item);
  }

  getItems(): readonly T[] {
    return this.items;
  }
}
