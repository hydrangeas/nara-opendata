import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InMemoryEventBus } from './InMemoryEventBus';
import { EventBusError, EventBusErrorType } from './EventBusError';
import type { IEventHandler, ILogger } from '@nara-opendata/shared-kernel';
import { TestEvent } from './test/TestEventMap';

// テスト用のハンドラー
class TestEventHandler implements IEventHandler<TestEvent> {
  handleMock = vi.fn();

  async handle(event: TestEvent): Promise<void> {
    await this.handleMock(event);
  }

  getEventName(): string {
    return 'TestEvent' as const;
  }
}

// モックロガーの作成
const createMockLogger = (): ILogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('InMemoryEventBus エッジケース', () => {
  let eventBus: InMemoryEventBus;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    eventBus = new InMemoryEventBus(undefined, mockLogger);
  });

  describe('タイムアウト処理の追加テスト', () => {
    it('タイムアウトしてもPromiseがリークしない', async () => {
      const config = { handlerTimeoutMs: 50 };
      const eventBus = new InMemoryEventBus(config, mockLogger);
      const handler = new TestEventHandler();
      const event = new TestEvent('timeout test');
      let resolveHandler: (() => void) | null = null;

      // 永続的に待機するハンドラー
      handler.handleMock.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveHandler = resolve;
          }),
      );

      eventBus.subscribe('TestEvent' as const, handler);

      // イベント発行はタイムアウトで完了する
      await eventBus.publish(event);

      // タイムアウトエラーが記録される
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Handler timeout after 50ms',
        expect.any(EventBusError),
        expect.any(Object),
      );

      // 後でPromiseを解決してもエラーにならない
      if (resolveHandler) {
        resolveHandler();
      }

      // 次のイベントは正常に処理される
      const event2 = new TestEvent('after timeout');
      handler.handleMock.mockResolvedValueOnce(undefined);
      await eventBus.publish(event2);

      expect(handler.handleMock).toHaveBeenCalledWith(event2);
    });

    it('複数のハンドラーが同時にタイムアウトしても正しく処理される', async () => {
      const config = { handlerTimeoutMs: 100 };
      const eventBus = new InMemoryEventBus(config, mockLogger);
      const handler1 = new TestEventHandler();
      const handler2 = new TestEventHandler();
      const handler3 = new TestEventHandler();
      const event = new TestEvent('multi-timeout');

      // すべてのハンドラーがタイムアウト
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      handler1.handleMock.mockImplementation(() => delay(200));
      handler2.handleMock.mockImplementation(() => delay(200));
      handler3.handleMock.mockResolvedValue(undefined); // これは正常に完了

      eventBus.subscribe('TestEvent' as const, handler1);
      eventBus.subscribe('TestEvent' as const, handler2);
      eventBus.subscribe('TestEvent' as const, handler3);

      await eventBus.publish(event);

      // 2つのタイムアウトエラーが記録される
      const errorCalls = (mockLogger.error as any).mock.calls;
      const timeoutErrors = errorCalls.filter((call: any[]) => call[0].includes('Handler timeout'));
      expect(timeoutErrors).toHaveLength(2);

      // handler3は正常に実行される
      expect(handler3.handleMock).toHaveBeenCalled();
    });
  });

  describe('エラー処理の包括的なテスト', () => {
    it('非Error型のcauseも正しく処理される', () => {
      const error = new EventBusError(
        EventBusErrorType.HANDLER_ERROR,
        'Test error',
        'TestEvent' as const,
        'test-id',
        'String error',
      );

      const json = error.toJSON();

      expect(json.cause).toBe('String error');
    });

    it('ハンドラーが同期・非同期でエラーをスローしても他のハンドラーは実行される', async () => {
      const handler1 = new TestEventHandler();
      const handler2 = new TestEventHandler();
      const handler3 = new TestEventHandler();
      const event = new TestEvent('error test');

      // handler1は同期エラー、handler2は非同期エラー、handler3は正常
      handler1.handleMock.mockImplementation(() => {
        throw new Error('Sync error');
      });
      handler2.handleMock.mockRejectedValue(new Error('Async error'));
      handler3.handleMock.mockResolvedValue(undefined);

      eventBus.subscribe('TestEvent' as const, handler1);
      eventBus.subscribe('TestEvent' as const, handler2);
      eventBus.subscribe('TestEvent' as const, handler3);

      await eventBus.publish(event);

      // すべてのハンドラーが呼ばれる
      expect(handler1.handleMock).toHaveBeenCalled();
      expect(handler2.handleMock).toHaveBeenCalled();
      expect(handler3.handleMock).toHaveBeenCalled();

      // エラーが2つログに記録される
      expect(mockLogger.error).toHaveBeenCalledTimes(2);
    });

    it('ハンドラーがnullやundefinedをスローしても処理が継続する', async () => {
      const handler1 = new TestEventHandler();
      const handler2 = new TestEventHandler();
      const event = new TestEvent('null error');

      handler1.handleMock.mockImplementation(() => {
        throw null;
      });
      handler2.handleMock.mockResolvedValue(undefined);

      eventBus.subscribe('TestEvent' as const, handler1);
      eventBus.subscribe('TestEvent' as const, handler2);

      await eventBus.publish(event);

      expect(handler2.handleMock).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in event handler for TestEvent',
        expect.any(EventBusError),
        expect.objectContaining({
          errorMessage: 'null',
        }),
      );
    });
  });

  describe('メモリリークの防止', () => {
    it('大量のイベントを処理してもメモリがリークしない', async () => {
      const config = { maxEventsPerCycle: 10000, debugMode: false };
      const eventBus = new InMemoryEventBus(config, mockLogger);
      const handler = new TestEventHandler();

      eventBus.subscribe('TestEvent' as const, handler);

      // 1000個のイベントを発行
      const events = Array.from({ length: 1000 }, (_, i) => new TestEvent(`data-${i}`));

      await eventBus.publishAll(events);

      expect(handler.handleMock).toHaveBeenCalledTimes(1000);

      // 処理後はペンディングイベントが空
      await eventBus.publish(new TestEvent('final'));
      expect(handler.handleMock).toHaveBeenCalledTimes(1001);
    });

    it('ハンドラーを適切にクリーンアップする', () => {
      const handler1 = new TestEventHandler();
      const handler2 = new TestEventHandler();

      // 複数のイベントタイプにハンドラーを登録
      eventBus.subscribe('EventA', handler1);
      eventBus.subscribe('EventB', handler1);
      eventBus.subscribe('EventA', handler2);
      eventBus.subscribe('EventB', handler2);

      // すべてクリア
      eventBus.clearAllHandlers();

      expect(mockLogger.info).toHaveBeenCalledWith('Cleared all handlers', {
        clearedHandlers: 4,
        clearedPendingEvents: 0,
      });
    });

    it('循環参照のあるイベントでもメモリリークしない', async () => {
      const handler = new TestEventHandler();
      const event: any = new TestEvent('circular');
      event.self = event; // 循環参照を作成

      eventBus.subscribe('TestEvent' as const, handler);

      await eventBus.publish(event);

      expect(handler.handleMock).toHaveBeenCalledWith(event);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('並行処理とレースコンディション', () => {
    it('同時に複数のpublishを呼んでも正しく処理される', async () => {
      const handler = new TestEventHandler();
      const events = Array.from({ length: 10 }, (_, i) => new TestEvent(`concurrent-${i}`));

      eventBus.subscribe('TestEvent' as const, handler);

      // 並行してpublishを実行
      const promises = events.map((event) => eventBus.publish(event));

      await Promise.all(promises);

      // すべてのイベントが処理される
      expect(handler.handleMock).toHaveBeenCalledTimes(10);
      events.forEach((event) => {
        expect(handler.handleMock).toHaveBeenCalledWith(event);
      });
    });

    it('publish中にsubscribe/unsubscribeしても安全', async () => {
      const handler1 = new TestEventHandler();
      const handler2 = new TestEventHandler();
      const event = new TestEvent('dynamic subscription');

      handler1.handleMock.mockImplementation(async () => {
        // ハンドラー実行中に別のハンドラーを登録
        eventBus.subscribe('TestEvent' as const, handler2);
      });

      eventBus.subscribe('TestEvent' as const, handler1);

      await eventBus.publish(event);

      // handler1は実行される
      expect(handler1.handleMock).toHaveBeenCalledWith(event);
      // handler2は今回のイベントでは実行されない
      expect(handler2.handleMock).not.toHaveBeenCalled();

      // 次のイベントではhandler2も実行される
      const event2 = new TestEvent('second event');
      await eventBus.publish(event2);

      expect(handler2.handleMock).toHaveBeenCalledWith(event2);
    });
  });
});
