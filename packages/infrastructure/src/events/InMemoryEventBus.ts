import type { IEventBus, IEventHandler, DomainEvent, ILogger } from '@nara-opendata/shared-kernel';
import { ConsoleLogger } from '../logging';

/**
 * インメモリーイベントバス実装
 *
 * ドメインイベントの発行と配信を管理するイベントバスの実装です。
 *
 * ## 特徴
 * - 遅延ディスパッチ: イベントは現在の実行コンテキストが終了してから配信されます
 * - エラー分離: 個別のハンドラーでエラーが発生しても他のハンドラーは実行されます
 * - 重複防止: 同じハンドラーインスタンスは重複登録されません
 *
 * ## メモリ管理
 * ハンドラーは明示的にunsubscribeされるか、clearAllHandlersが呼ばれるまで保持されます。
 * 不要になったハンドラーは必ずunsubscribeしてメモリリークを防いでください。
 *
 * @example
 * ```typescript
 * const eventBus = new InMemoryEventBus();
 * const handler = new MyEventHandler();
 *
 * // ハンドラーを登録
 * eventBus.subscribe('UserCreated', handler);
 *
 * // イベントを発行
 * await eventBus.publish(new UserCreatedEvent(userId));
 *
 * // 不要になったらハンドラーを解除
 * eventBus.unsubscribe('UserCreated', handler);
 * ```
 */
export class InMemoryEventBus implements IEventBus {
  private readonly handlers = new Map<string, IEventHandler<DomainEvent>[]>();
  private pendingEvents: DomainEvent[] = [];
  private isDispatching = false;
  private readonly logger: ILogger;

  /**
   * InMemoryEventBusのインスタンスを作成します
   * @param logger ロガーインスタンス（省略時はConsoleLoggerを使用）
   */
  constructor(logger?: ILogger) {
    this.logger = logger || new ConsoleLogger('InMemoryEventBus');
  }

  /**
   * イベントハンドラーを登録する
   *
   * @param eventName イベント名
   * @param handler 登録するイベントハンドラー
   * @remarks 同じハンドラーインスタンスが既に登録されている場合は何もしません
   */
  subscribe<T extends DomainEvent>(eventName: string, handler: IEventHandler<T>): void {
    const handlers = this.handlers.get(eventName) || [];

    // 同じハンドラーが既に登録されていないかチェック
    // Note: as演算子を使用して型の互換性を保証
    if (handlers.includes(handler as IEventHandler<DomainEvent>)) {
      this.logger.debug(`Handler already registered for event: ${eventName}`);
      return;
    }

    handlers.push(handler as IEventHandler<DomainEvent>);
    this.handlers.set(eventName, handlers);
    this.logger.debug(`Handler registered for event: ${eventName}`);
  }

  /**
   * イベントハンドラーの登録を解除する
   *
   * @param eventName イベント名
   * @param handler 解除するイベントハンドラー
   * @remarks 指定されたハンドラーが登録されていない場合は何もしません
   */
  unsubscribe<T extends DomainEvent>(eventName: string, handler: IEventHandler<T>): void {
    const handlers = this.handlers.get(eventName);
    if (!handlers) {
      this.logger.debug(`No handlers registered for event: ${eventName}`);
      return;
    }

    const index = handlers.indexOf(handler as IEventHandler<DomainEvent>);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.logger.debug(`Handler unregistered for event: ${eventName}`);

      // ハンドラーが空になった場合はMapから削除
      if (handlers.length === 0) {
        this.handlers.delete(eventName);
        this.logger.debug(`All handlers removed for event: ${eventName}`);
      }
    } else {
      this.logger.debug(`Handler not found for event: ${eventName}`);
    }
  }

  /**
   * すべてのイベントハンドラーをクリアする
   *
   * @remarks ペンディング中のイベントもクリアされます
   */
  clearAllHandlers(): void {
    const handlerCount = Array.from(this.handlers.values()).reduce(
      (sum, handlers) => sum + handlers.length,
      0,
    );
    const pendingCount = this.pendingEvents.length;

    this.handlers.clear();
    this.pendingEvents = [];

    this.logger.info(`Cleared all handlers`, {
      clearedHandlers: handlerCount,
      clearedPendingEvents: pendingCount,
    });
  }

  /**
   * イベントを発行する
   *
   * @param event 発行するドメインイベント
   * @remarks
   * - 遅延ディスパッチ機能により、現在の実行コンテキストが終了してから配信されます
   * - イベントハンドラー内で新たなイベントを発行した場合、それらも同じサイクルで処理されます
   */
  async publish(event: DomainEvent): Promise<void> {
    this.pendingEvents.push(event);
    this.logger.debug(`Event queued for dispatch: ${event.eventName}`, {
      eventId: event.eventId,
    });

    if (!this.isDispatching) {
      await this.dispatchPendingEvents();
    }
  }

  /**
   * 複数のイベントを発行する
   *
   * @param events 発行するドメインイベントの配列
   * @remarks 遅延ディスパッチ機能により、すべてのイベントが同じサイクルで配信されます
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    this.pendingEvents.push(...events);
    this.logger.debug(`Multiple events queued for dispatch`, {
      eventCount: events.length,
      eventNames: events.map((e) => e.eventName),
    });

    if (!this.isDispatching) {
      await this.dispatchPendingEvents();
    }
  }

  /**
   * ペンディング中のイベントをディスパッチする
   *
   * @remarks
   * - エラーが発生しても他のハンドラーの実行は継続します
   * - イベントハンドラー内で新たなイベントが発行された場合、同じサイクルで処理されます
   */
  private async dispatchPendingEvents(): Promise<void> {
    this.isDispatching = true;
    let dispatchedCount = 0;

    try {
      // Promise.resolve()で非同期実行を保証
      await Promise.resolve();

      while (this.pendingEvents.length > 0) {
        const events = [...this.pendingEvents];
        this.pendingEvents = [];

        this.logger.debug(`Dispatching events`, {
          eventCount: events.length,
          eventNames: events.map((e) => e.eventName),
        });

        for (const event of events) {
          const handlers = this.handlers.get(event.eventName) || [];

          if (handlers.length === 0) {
            this.logger.debug(`No handlers for event: ${event.eventName}`, {
              eventId: event.eventId,
            });
            continue;
          }

          // 各ハンドラーを並列実行
          const handlerPromises = handlers.map((handler) => this.executeHandler(handler, event));

          // すべてのハンドラーの実行を待つが、エラーがあっても続行
          await Promise.allSettled(handlerPromises);
          dispatchedCount++;
        }
      }

      this.logger.debug(`Event dispatch completed`, {
        dispatchedCount,
      });
    } finally {
      this.isDispatching = false;
    }
  }

  /**
   * 個別のハンドラーを実行する
   *
   * @param handler 実行するイベントハンドラー
   * @param event 処理するドメインイベント
   * @remarks エラーが発生した場合はログに記録し、他のハンドラーの実行は継続します
   */
  private async executeHandler(
    handler: IEventHandler<DomainEvent>,
    event: DomainEvent,
  ): Promise<void> {
    try {
      await handler.handle(event);
      this.logger.debug(`Event handler executed successfully`, {
        eventName: event.eventName,
        eventId: event.eventId,
      });
    } catch (error) {
      // エラーが発生してもイベント処理全体は継続
      this.logger.error(`Error in event handler for ${event.eventName}`, error, {
        eventId: event.eventId,
        eventName: event.eventName,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
