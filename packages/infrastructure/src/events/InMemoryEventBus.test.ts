import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InMemoryEventBus } from './InMemoryEventBus';
import type { IEventHandler, ILogger } from '@nara-opendata/shared-kernel';
import { TestEvent, AnotherTestEvent } from './test/TestEventMap';

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

describe('InMemoryEventBus', () => {
  let eventBus: InMemoryEventBus;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
    eventBus = new InMemoryEventBus(undefined, mockLogger); // config is first parameter now
  });

  describe('subscribe', () => {
    it('ハンドラーを登録できる', () => {
      const handler = new TestEventHandler();

      expect(() => eventBus.subscribe('TestEvent' as const, handler)).not.toThrow();
    });

    it('同じハンドラーは重複登録されない', async () => {
      const handler = new TestEventHandler();
      const event = new TestEvent('test data');

      eventBus.subscribe('TestEvent' as const, handler);
      eventBus.subscribe('TestEvent' as const, handler); // 重複登録

      await eventBus.publish(event);

      // 1回しか呼ばれないことを確認
      expect(handler.handleMock).toHaveBeenCalledTimes(1);
    });

    it('複数の異なるハンドラーを登録できる', async () => {
      const handler1 = new TestEventHandler();
      const handler2 = new TestEventHandler();
      const event = new TestEvent('test data');

      eventBus.subscribe('TestEvent' as const, handler1);
      eventBus.subscribe('TestEvent' as const, handler2);

      await eventBus.publish(event);

      expect(handler1.handleMock).toHaveBeenCalledWith(event);
      expect(handler2.handleMock).toHaveBeenCalledWith(event);
    });
  });

  describe('unsubscribe', () => {
    it('ハンドラーの登録を解除できる', async () => {
      const handler = new TestEventHandler();
      const event = new TestEvent('test data');

      eventBus.subscribe('TestEvent' as const, handler);
      eventBus.unsubscribe('TestEvent' as const, handler);

      await eventBus.publish(event);

      expect(handler.handleMock).not.toHaveBeenCalled();
    });

    it('存在しないハンドラーの解除はエラーにならない', () => {
      const handler = new TestEventHandler();

      expect(() => eventBus.unsubscribe('TestEvent' as const, handler)).not.toThrow();
    });

    it('複数ハンドラーのうち1つだけを解除できる', async () => {
      const handler1 = new TestEventHandler();
      const handler2 = new TestEventHandler();
      const event = new TestEvent('test data');

      eventBus.subscribe('TestEvent' as const, handler1);
      eventBus.subscribe('TestEvent' as const, handler2);
      eventBus.unsubscribe('TestEvent' as const, handler1);

      await eventBus.publish(event);

      expect(handler1.handleMock).not.toHaveBeenCalled();
      expect(handler2.handleMock).toHaveBeenCalledWith(event);
    });
  });

  describe('clearAllHandlers', () => {
    it('すべてのハンドラーをクリアできる', async () => {
      const handler1 = new TestEventHandler();
      const handler2 = new TestEventHandler();
      const event = new TestEvent('test data');

      eventBus.subscribe('TestEvent' as const, handler1);
      eventBus.subscribe('AnotherEvent', handler2);

      eventBus.clearAllHandlers();

      await eventBus.publish(event);

      expect(handler1.handleMock).not.toHaveBeenCalled();
      expect(handler2.handleMock).not.toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('イベントを発行できる', async () => {
      const handler = new TestEventHandler();
      const event = new TestEvent('test data');

      eventBus.subscribe('TestEvent' as const, handler);

      await eventBus.publish(event);

      expect(handler.handleMock).toHaveBeenCalledWith(event);
    });

    it('イベントは非同期で配信される', async () => {
      const handler = new TestEventHandler();
      const event = new TestEvent('test data');
      let handlerCalled = false;

      handler.handleMock.mockImplementation(() => {
        handlerCalled = true;
      });

      eventBus.subscribe('TestEvent' as const, handler);

      const publishPromise = eventBus.publish(event);

      // publishの直後はまだハンドラーが呼ばれていない
      expect(handlerCalled).toBe(false);

      await publishPromise;

      // awaitの後はハンドラーが呼ばれている
      expect(handlerCalled).toBe(true);
    });

    it('ハンドラーがない場合でもエラーにならない', async () => {
      const event = new TestEvent('test data');

      await expect(eventBus.publish(event)).resolves.not.toThrow();
    });

    it('ハンドラーでエラーが発生しても他のハンドラーは実行される', async () => {
      const handler1 = new TestEventHandler();
      const handler2 = new TestEventHandler();
      const event = new TestEvent('test data');

      handler1.handleMock.mockRejectedValue(new Error('Handler 1 error'));

      eventBus.subscribe('TestEvent' as const, handler1);
      eventBus.subscribe('TestEvent' as const, handler2);

      await eventBus.publish(event);

      expect(handler1.handleMock).toHaveBeenCalled();
      expect(handler2.handleMock).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in event handler for TestEvent',
        expect.any(Object), // EventBusError
        expect.objectContaining({
          eventId: event.eventId,
          eventName: 'TestEvent' as const,
          errorType: 'HANDLER_ERROR',
          errorMessage: 'Handler 1 error',
        }),
      );
    });
  });

  describe('publishAll', () => {
    it('複数のイベントを発行できる', async () => {
      const handler = new TestEventHandler();
      const event1 = new TestEvent('data1');
      const event2 = new TestEvent('data2');

      eventBus.subscribe('TestEvent' as const, handler);

      await eventBus.publishAll([event1, event2]);

      expect(handler.handleMock).toHaveBeenCalledTimes(2);
      expect(handler.handleMock).toHaveBeenCalledWith(event1);
      expect(handler.handleMock).toHaveBeenCalledWith(event2);
    });

    it('異なる種類のイベントを正しくルーティングする', async () => {
      const testHandler = new TestEventHandler();
      const anotherHandler: IEventHandler<AnotherTestEvent> = {
        handle: vi.fn(),
        getEventName: () => 'AnotherTestEvent' as const,
      };

      const testEvent = new TestEvent('test data');
      const anotherEvent = new AnotherTestEvent(42);

      eventBus.subscribe('TestEvent' as const, testHandler);
      eventBus.subscribe('AnotherTestEvent' as const, anotherHandler);

      await eventBus.publishAll([testEvent, anotherEvent]);

      expect(testHandler.handleMock).toHaveBeenCalledWith(testEvent);
      expect(anotherHandler.handle).toHaveBeenCalledWith(anotherEvent);
    });
  });

  describe('遅延ディスパッチ', () => {
    it('イベント発行中に追加されたイベントも処理される', async () => {
      const handler = new TestEventHandler();
      const event1 = new TestEvent('data1');
      const event2 = new TestEvent('data2');

      handler.handleMock.mockImplementationOnce(async () => {
        // ハンドラー実行中に新しいイベントを発行
        await eventBus.publish(event2);
      });

      eventBus.subscribe('TestEvent' as const, handler);

      await eventBus.publish(event1);

      expect(handler.handleMock).toHaveBeenCalledTimes(2);
      expect(handler.handleMock).toHaveBeenNthCalledWith(1, event1);
      expect(handler.handleMock).toHaveBeenNthCalledWith(2, event2);
    });
  });
});
