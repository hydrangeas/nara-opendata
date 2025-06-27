import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryEventBus } from './InMemoryEventBus';
import type { IEventHandler, DomainEvent, ILogger } from '@nara-opendata/shared-kernel';

// テスト用のイベントクラス
class BenchmarkEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventName = 'BenchmarkEvent';
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

// テスト用のハンドラー
class BenchmarkHandler implements IEventHandler<BenchmarkEvent> {
  processedCount = 0;

  async handle(_event: BenchmarkEvent): Promise<void> {
    this.processedCount++;
    // 軽い処理をシミュレート
    await Promise.resolve();
  }

  getEventName(): string {
    return 'BenchmarkEvent';
  }
}

// モックロガーの作成（パフォーマンステストでは最小限に）
const createSilentLogger = (): ILogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('InMemoryEventBus パフォーマンスベンチマーク', () => {
  let eventBus: InMemoryEventBus;
  let logger: ILogger;

  beforeEach(() => {
    logger = createSilentLogger();
  });

  describe('大量ハンドラーのパフォーマンス', () => {
    it('100個のハンドラーで1000個のイベントを処理できる', async () => {
      const config = { debugMode: false, maxEventsPerCycle: 10000 };
      eventBus = new InMemoryEventBus(config, logger);
      const handlers: BenchmarkHandler[] = [];

      // 100個のハンドラーを登録
      const startSubscribe = performance.now();
      for (let i = 0; i < 100; i++) {
        const handler = new BenchmarkHandler();
        handlers.push(handler);
        eventBus.subscribe('BenchmarkEvent', handler);
      }
      const subscribeTime = performance.now() - startSubscribe;

      // 1000個のイベントを作成
      const events = Array.from({ length: 1000 }, (_, i) => new BenchmarkEvent(i));

      // イベントを発行
      const startPublish = performance.now();
      await eventBus.publishAll(events);
      const publishTime = performance.now() - startPublish;

      // 結果を検証
      handlers.forEach((handler) => {
        expect(handler.processedCount).toBe(1000);
      });

      // パフォーマンス情報を出力（デバッグ用）
      console.log(`Subscribe time for 100 handlers: ${subscribeTime.toFixed(2)}ms`);
      console.log(`Publish time for 1000 events × 100 handlers: ${publishTime.toFixed(2)}ms`);
      console.log(`Average time per event: ${(publishTime / 1000).toFixed(2)}ms`);

      // 基本的なパフォーマンス基準
      expect(subscribeTime).toBeLessThan(50); // 100ハンドラーの登録は50ms以内
      expect(publishTime).toBeLessThan(5000); // 100,000回のハンドラー実行は5秒以内
    });

    it('単一ハンドラーの最適化が機能する', async () => {
      const config = { debugMode: false, maxEventsPerCycle: 10000 };
      eventBus = new InMemoryEventBus(config, logger);
      const handler = new BenchmarkHandler();

      eventBus.subscribe('BenchmarkEvent', handler);

      // 10000個のイベントを処理
      const events = Array.from({ length: 10000 }, (_, i) => new BenchmarkEvent(i));

      const startTime = performance.now();
      await eventBus.publishAll(events);
      const endTime = performance.now();

      expect(handler.processedCount).toBe(10000);

      const totalTime = endTime - startTime;
      console.log(`Single handler optimization: ${totalTime.toFixed(2)}ms for 10000 events`);

      // 単一ハンドラーの場合は高速であるべき
      expect(totalTime).toBeLessThan(1000); // 1秒以内
    });
  });

  describe('メモリ効率', () => {
    it('イベントが処理後に適切にクリアされる', async () => {
      const config = { debugMode: false, maxEventsPerCycle: 10000 };
      eventBus = new InMemoryEventBus(config, logger);
      const handler = new BenchmarkHandler();

      eventBus.subscribe('BenchmarkEvent', handler);

      // メモリ使用量を測定（簡易的）
      const initialMemory = process.memoryUsage().heapUsed;

      // 5000個のイベントを5回発行
      for (let batch = 0; batch < 5; batch++) {
        const events = Array.from({ length: 5000 }, (_, i) => new BenchmarkEvent(batch * 5000 + i));
        await eventBus.publishAll(events);
      }

      // ガベージコレクションのヒント
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(
        `Memory increase after 25000 events: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
      );

      expect(handler.processedCount).toBe(25000);
      // メモリ増加が合理的な範囲内（50MB以下）
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('並行処理のパフォーマンス', () => {
    it('並行publish呼び出しが効率的に処理される', async () => {
      const config = { debugMode: false, maxEventsPerCycle: 10000 };
      eventBus = new InMemoryEventBus(config, logger);
      const handler = new BenchmarkHandler();

      eventBus.subscribe('BenchmarkEvent', handler);

      // 100個の並行publish
      const startTime = performance.now();
      const promises = Array.from({ length: 100 }, async (_, i) => {
        const event = new BenchmarkEvent(i);
        await eventBus.publish(event);
      });

      await Promise.all(promises);
      const endTime = performance.now();

      expect(handler.processedCount).toBe(100);

      const totalTime = endTime - startTime;
      console.log(`Concurrent publish time: ${totalTime.toFixed(2)}ms for 100 events`);

      // 並行処理でも合理的な時間内に完了
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('イベントサイクルのパフォーマンス', () => {
    it('連鎖的なイベント発行が効率的に処理される', async () => {
      const config = { debugMode: false, maxDispatchCycles: 10 };
      eventBus = new InMemoryEventBus(config, logger);

      let chainCount = 0;
      const chainHandler: IEventHandler<BenchmarkEvent> = {
        async handle(event: BenchmarkEvent): Promise<void> {
          chainCount++;
          if (event.index < 9) {
            // 次のイベントを発行（最大10回のチェーン）
            await eventBus.publish(new BenchmarkEvent(event.index + 1));
          }
        },
        getEventName: () => 'BenchmarkEvent',
      };

      eventBus.subscribe('BenchmarkEvent', chainHandler);

      const startTime = performance.now();
      await eventBus.publish(new BenchmarkEvent(0));
      const endTime = performance.now();

      expect(chainCount).toBe(10);

      const totalTime = endTime - startTime;
      console.log(`Chain event time: ${totalTime.toFixed(2)}ms for 10 chained events`);

      // 連鎖的なイベントも効率的に処理される
      expect(totalTime).toBeLessThan(100);
    });
  });
});
