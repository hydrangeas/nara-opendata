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

describe('InMemoryEventBus Configuration', () => {
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  describe('最大サイクル数の制限', () => {
    it('最大サイクル数を超えるとエラーをスローする', async () => {
      const eventBus = new InMemoryEventBus({ maxDispatchCycles: 2 }, mockLogger);
      const handler = new TestEventHandler();

      // ハンドラーが新しいイベントを発行し続ける（無限ループ）
      handler.handleMock.mockImplementation(async () => {
        await eventBus.publish(new TestEvent('recursive'));
      });

      eventBus.subscribe('TestEvent' as const, handler);

      // エラーがスローされることを確認
      await expect(eventBus.publish(new TestEvent('initial'))).rejects.toThrow(EventBusError);

      // エラーの詳細を確認
      try {
        await eventBus.publish(new TestEvent('initial'));
      } catch (error) {
        expect(error).toBeInstanceOf(EventBusError);
        if (error instanceof EventBusError) {
          expect(error.type).toBe(EventBusErrorType.MAX_CYCLES_EXCEEDED);
          expect(error.message).toContain('Maximum dispatch cycles (2) exceeded');
        }
      }
    });
  });

  describe('最大イベント数の制限', () => {
    // Note: 現在の実装では、各publish()呼び出しが即座にディスパッチを開始するため、
    // pendingEventsが蓄積されることはありません。この制限は主にpublishAll()や
    // ハンドラー内での再帰的なイベント発行を防ぐためのものです。

    it('publishAllで最大イベント数を超えるとエラーをスローする', async () => {
      const eventBus = new InMemoryEventBus({ maxEventsPerCycle: 3 }, mockLogger);

      const events = [
        new TestEvent('event1'),
        new TestEvent('event2'),
        new TestEvent('event3'),
        new TestEvent('event4'),
      ];

      await expect(eventBus.publishAll(events)).rejects.toThrow(EventBusError);
    });
  });

  describe('ハンドラータイムアウト', () => {
    it('ハンドラーの実行がタイムアウトするとエラーをログに記録する', async () => {
      const eventBus = new InMemoryEventBus({ handlerTimeoutMs: 100 }, mockLogger);
      const handler = new TestEventHandler();

      // 200msかかるハンドラー
      handler.handleMock.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200)),
      );

      eventBus.subscribe('TestEvent' as const, handler);
      await eventBus.publish(new TestEvent('timeout test'));

      // エラーログが記録されることを確認
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Handler timeout after 100ms'),
        expect.any(EventBusError),
        expect.objectContaining({
          errorType: EventBusErrorType.HANDLER_TIMEOUT,
        }),
      );
    });

    it('タイムアウトしても他のハンドラーは実行される', async () => {
      const eventBus = new InMemoryEventBus({ handlerTimeoutMs: 100 }, mockLogger);
      const slowHandler = new TestEventHandler();
      const fastHandler = new TestEventHandler();

      // 遅いハンドラー
      slowHandler.handleMock.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200)),
      );

      // 速いハンドラー
      fastHandler.handleMock.mockResolvedValue(undefined);

      eventBus.subscribe('TestEvent' as const, slowHandler);
      eventBus.subscribe('TestEvent' as const, fastHandler);

      await eventBus.publish(new TestEvent('test'));

      // 速いハンドラーは実行される
      expect(fastHandler.handleMock).toHaveBeenCalled();
    });
  });

  describe('デバッグモード', () => {
    it('デバッグモードが有効な場合、詳細なログが出力される', async () => {
      const eventBus = new InMemoryEventBus({ debugMode: true }, mockLogger);
      const handler = new TestEventHandler();

      eventBus.subscribe('TestEvent' as const, handler);
      await eventBus.publish(new TestEvent('debug test'));

      // デバッグログが出力されることを確認
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'InMemoryEventBus initialized',
        expect.any(Object),
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Handler registered'),
        expect.any(Object),
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Event queued'),
        expect.any(Object),
      );
    });

    it('デバッグモードが無効な場合、デバッグログは出力されない', async () => {
      const eventBus = new InMemoryEventBus({ debugMode: false }, mockLogger);
      const handler = new TestEventHandler();

      eventBus.subscribe('TestEvent' as const, handler);
      await eventBus.publish(new TestEvent('no debug'));

      // デバッグログが出力されないことを確認
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });
  });

  describe('エラーオブジェクトの詳細', () => {
    it('EventBusErrorがJSON形式で詳細情報を提供する', () => {
      const cause = new Error('Original error');
      const error = new EventBusError(
        EventBusErrorType.HANDLER_ERROR,
        'Test error message',
        'TestEvent' as const,
        'test-123',
        cause,
      );

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'EventBusError',
        type: EventBusErrorType.HANDLER_ERROR,
        message: 'Test error message',
        eventName: 'TestEvent' as const,
        eventId: 'test-123',
        cause: {
          name: 'Error',
          message: 'Original error',
        },
      });
      expect(json.stack).toBeDefined();
    });
  });
});
