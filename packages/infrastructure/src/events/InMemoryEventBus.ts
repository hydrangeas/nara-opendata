import type {
  IEventBus,
  IEventHandler,
  DomainEvent,
  ILogger,
  EventName,
  EventType,
} from '@nara-opendata/shared-kernel';
import { ConsoleLogger } from '../logging';
import type { IEventBusConfig } from './EventBusConfig';
import { defaultEventBusConfig } from './EventBusConfig';
import { EventBusError, EventBusErrorType } from './EventBusError';

/**
 * インメモリーイベントバス実装
 *
 * ドメインイベントの発行と配信を管理するイベントバスの実装です。
 *
 * ## 特徴
 * - 遅延ディスパッチ: イベントは現在の実行コンテキストが終了してから配信されます
 * - エラー分離: 個別のハンドラーでエラーが発生しても他のハンドラーは実行されます
 * - 重複防止: 同じハンドラーインスタンスは重複登録されません
 * - 設定可能な制限: サイクル数、イベント数、タイムアウトを設定可能
 * - デバッグモード: 詳細なログ出力をサポート
 *
 * ## パフォーマンス特性
 * - ハンドラー検索: O(1) - イベント名でのハッシュマップ検索
 * - イベント発行: O(n) - nはハンドラー数
 * - メモリ使用量: ハンドラー数とペンディングイベント数に比例
 *
 * ## スレッドセーフティ
 * この実装はシングルスレッド環境（Node.js）を想定しています。
 * 並行処理は非同期処理として扱われ、イベントループによって安全に処理されます。
 *
 * ## メモリ管理
 * - ハンドラーは明示的にunsubscribeされるか、clearAllHandlersが呼ばれるまで保持されます
 * - 不要になったハンドラーは必ずunsubscribeしてメモリリークを防いでください
 * - maxEventsPerCycleを適切に設定して、メモリ使用量を制限してください
 *
 * @example 基本的な使用方法
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
 *
 * @example カスタム設定での使用
 * ```typescript
 * const config: IEventBusConfig = {
 *   maxDispatchCycles: 5,
 *   maxEventsPerCycle: 100,
 *   handlerTimeoutMs: 5000,
 *   debugMode: true,
 * };
 *
 * const eventBus = new InMemoryEventBus(config, logger);
 * ```
 */
export class InMemoryEventBus implements IEventBus {
  private readonly handlers = new Map<string, IEventHandler<DomainEvent>[]>();
  private pendingEvents: DomainEvent[] = [];
  private isDispatching = false;
  private readonly logger: ILogger;
  private readonly config: Required<IEventBusConfig>;
  private currentCycle = 0;

  /**
   * InMemoryEventBusのインスタンスを作成します
   * @param config イベントバスの設定（省略時はデフォルト設定を使用）
   * @param logger ロガーインスタンス（省略時はConsoleLoggerを使用）
   */
  constructor(config?: IEventBusConfig, logger?: ILogger) {
    this.config = { ...defaultEventBusConfig, ...config };
    this.logger = logger || new ConsoleLogger('InMemoryEventBus');

    if (this.config.debugMode) {
      this.logger.debug('InMemoryEventBus initialized', { config: this.config });
    }
  }

  /**
   * イベントハンドラーを登録する
   *
   * @param eventName イベント名
   * @param handler 登録するイベントハンドラー
   * @remarks 同じハンドラーインスタンスが既に登録されている場合は何もしません
   */
  subscribe<K extends EventName>(eventName: K, handler: IEventHandler<EventType<K>>): void {
    let handlers = this.handlers.get(eventName as string);

    if (!handlers) {
      // 新しいイベントタイプの場合、配列を作成
      handlers = [];
      this.handlers.set(eventName as string, handlers);
    } else {
      // 同じハンドラーが既に登録されていないかチェック
      // Note: as演算子を使用して型の互換性を保証
      if (handlers.includes(handler as IEventHandler<DomainEvent>)) {
        if (this.config.debugMode) {
          this.logger.debug(`Handler already registered for event: ${eventName}`);
        }
        return;
      }
    }

    handlers.push(handler as IEventHandler<DomainEvent>);

    if (this.config.debugMode) {
      this.logger.debug(`Handler registered for event: ${eventName}`, {
        handlerCount: handlers.length,
      });
    }
  }

  /**
   * イベントハンドラーの登録を解除する
   *
   * @param eventName イベント名
   * @param handler 解除するイベントハンドラー
   * @remarks 指定されたハンドラーが登録されていない場合は何もしません
   */
  unsubscribe<K extends EventName>(eventName: K, handler: IEventHandler<EventType<K>>): void {
    const handlers = this.handlers.get(eventName as string);
    if (!handlers) {
      if (this.config.debugMode) {
        this.logger.debug(`No handlers registered for event: ${eventName}`);
      }
      return;
    }

    const index = handlers.indexOf(handler as IEventHandler<DomainEvent>);
    if (index !== -1) {
      handlers.splice(index, 1);

      if (this.config.debugMode) {
        this.logger.debug(`Handler unregistered for event: ${eventName}`, {
          remainingHandlers: handlers.length,
        });
      }

      // ハンドラーが空になった場合はMapから削除
      if (handlers.length === 0) {
        this.handlers.delete(eventName as string);
        if (this.config.debugMode) {
          this.logger.debug(`All handlers removed for event: ${eventName}`);
        }
      }
    } else {
      if (this.config.debugMode) {
        this.logger.debug(`Handler not found for event: ${eventName}`);
      }
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
   * @throws {EventBusError} イベント数が上限を超えた場合
   */
  async publish<K extends EventName>(event: EventType<K>): Promise<void> {
    // イベント数の上限チェック
    if (this.pendingEvents.length >= this.config.maxEventsPerCycle) {
      throw new EventBusError(
        EventBusErrorType.MAX_EVENTS_EXCEEDED,
        `Maximum events per cycle (${this.config.maxEventsPerCycle}) exceeded`,
        event.eventName,
        event.eventId,
      );
    }

    this.pendingEvents.push(event);

    if (this.config.debugMode) {
      this.logger.debug(`Event queued for dispatch: ${event.eventName}`, {
        eventId: event.eventId,
        pendingCount: this.pendingEvents.length,
      });
    }

    if (!this.isDispatching) {
      this.currentCycle = 0;
      await this.dispatchPendingEvents();
    }
  }

  /**
   * 複数のイベントを発行する
   *
   * @param events 発行するドメインイベントの配列
   * @remarks 遅延ディスパッチ機能により、すべてのイベントが同じサイクルで配信されます
   * @throws {EventBusError} イベント数が上限を超えた場合
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    // イベント数の上限チェック
    if (this.pendingEvents.length + events.length > this.config.maxEventsPerCycle) {
      throw new EventBusError(
        EventBusErrorType.MAX_EVENTS_EXCEEDED,
        `Maximum events per cycle (${this.config.maxEventsPerCycle}) would be exceeded`,
      );
    }

    this.pendingEvents.push(...events);

    if (this.config.debugMode) {
      this.logger.debug(`Multiple events queued for dispatch`, {
        eventCount: events.length,
        eventNames: events.map((e) => e.eventName),
        totalPending: this.pendingEvents.length,
      });
    }

    if (!this.isDispatching) {
      this.currentCycle = 0;
      await this.dispatchPendingEvents();
    }
  }

  /**
   * ペンディング中のイベントをディスパッチする
   *
   * @remarks
   * - エラーが発生しても他のハンドラーの実行は継続します
   * - イベントハンドラー内で新たなイベントが発行された場合、同じサイクルで処理されます
   * @throws {EventBusError} ディスパッチサイクルが上限を超えた場合
   */
  private async dispatchPendingEvents(): Promise<void> {
    this.isDispatching = true;
    let totalDispatchedCount = 0;

    try {
      // Promise.resolve()で非同期実行を保証
      await Promise.resolve();

      while (this.pendingEvents.length > 0) {
        // サイクル数の上限チェック
        if (this.currentCycle >= this.config.maxDispatchCycles) {
          const remainingEvents = this.pendingEvents.length;
          this.pendingEvents = []; // 残りのイベントをクリア

          throw new EventBusError(
            EventBusErrorType.MAX_CYCLES_EXCEEDED,
            `Maximum dispatch cycles (${this.config.maxDispatchCycles}) exceeded. ${remainingEvents} events were dropped.`,
          );
        }

        this.currentCycle++;
        const events = [...this.pendingEvents];
        this.pendingEvents = [];

        if (this.config.debugMode) {
          this.logger.debug(`Dispatching events in cycle ${this.currentCycle}`, {
            eventCount: events.length,
            eventNames: events.map((e) => e.eventName),
          });
        }

        let cycleDispatchedCount = 0;
        for (const event of events) {
          const handlers = this.handlers.get(event.eventName);

          if (!handlers || handlers.length === 0) {
            if (this.config.debugMode) {
              this.logger.debug(`No handlers for event: ${event.eventName}`, {
                eventId: event.eventId,
              });
            }
            continue;
          }

          // 各ハンドラーを並列実行
          // パフォーマンス最適化: 1つのハンドラーの場合は配列作成を避ける
          if (handlers.length === 1) {
            const firstHandler = handlers[0];
            if (firstHandler) {
              await this.executeHandler(firstHandler, event);
            }
          } else {
            const handlerPromises = handlers.map((handler) => this.executeHandler(handler, event));
            // すべてのハンドラーの実行を待つが、エラーがあっても続行
            await Promise.allSettled(handlerPromises);
          }
          cycleDispatchedCount++;
        }

        totalDispatchedCount += cycleDispatchedCount;

        if (this.config.debugMode) {
          this.logger.debug(`Cycle ${this.currentCycle} completed`, {
            dispatchedInCycle: cycleDispatchedCount,
            totalDispatched: totalDispatchedCount,
          });
        }
      }

      this.logger.info(`Event dispatch completed`, {
        totalCycles: this.currentCycle,
        totalDispatched: totalDispatchedCount,
      });
    } finally {
      this.isDispatching = false;
      this.currentCycle = 0;
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
      // タイムアウトPromiseを作成
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new EventBusError(
              EventBusErrorType.HANDLER_TIMEOUT,
              `Handler timeout after ${this.config.handlerTimeoutMs}ms`,
              event.eventName,
              event.eventId,
            ),
          );
        }, this.config.handlerTimeoutMs);
      });

      // ハンドラー実行とタイムアウトをrace
      await Promise.race([handler.handle(event), timeoutPromise]);

      if (this.config.debugMode) {
        this.logger.debug(`Event handler executed successfully`, {
          eventName: event.eventName,
          eventId: event.eventId,
        });
      }
    } catch (error) {
      // エラーが発生してもイベント処理全体は継続
      const eventBusError =
        error instanceof EventBusError
          ? error
          : new EventBusError(
              EventBusErrorType.HANDLER_ERROR,
              `Error in event handler for ${event.eventName}`,
              event.eventName,
              event.eventId,
              error,
            );

      this.logger.error(eventBusError.message, eventBusError, {
        eventId: event.eventId,
        eventName: event.eventName,
        errorType: eventBusError.type,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
