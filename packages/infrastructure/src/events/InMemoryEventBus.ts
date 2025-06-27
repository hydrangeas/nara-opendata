import type { IEventBus, IEventHandler, DomainEvent } from '@nara-opendata/shared-kernel';

/**
 * インメモリーイベントバス実装
 * ドメインイベントの発行と配信を管理する
 */
export class InMemoryEventBus implements IEventBus {
  private handlers = new Map<string, IEventHandler<DomainEvent>[]>();
  private pendingEvents: DomainEvent[] = [];
  private isDispatching = false;

  /**
   * イベントハンドラーを登録する
   */
  subscribe<T extends DomainEvent>(eventName: string, handler: IEventHandler<T>): void {
    const handlers = this.handlers.get(eventName) || [];

    // 同じハンドラーが既に登録されていないかチェック
    if (handlers.includes(handler)) {
      return;
    }

    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }

  /**
   * イベントハンドラーの登録を解除する
   */
  unsubscribe<T extends DomainEvent>(eventName: string, handler: IEventHandler<T>): void {
    const handlers = this.handlers.get(eventName);
    if (!handlers) {
      return;
    }

    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);

      // ハンドラーが空になった場合はMapから削除
      if (handlers.length === 0) {
        this.handlers.delete(eventName);
      }
    }
  }

  /**
   * すべてのイベントハンドラーをクリアする
   */
  clearAllHandlers(): void {
    this.handlers.clear();
    this.pendingEvents = [];
  }

  /**
   * イベントを発行する
   * 遅延ディスパッチ機能により、現在の実行コンテキストが終了してから配信される
   */
  async publish(event: DomainEvent): Promise<void> {
    this.pendingEvents.push(event);

    if (!this.isDispatching) {
      // setImmediateまたはPromise.resolve()で非同期実行
      await this.dispatchPendingEvents();
    }
  }

  /**
   * 複数のイベントを発行する
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    this.pendingEvents.push(...events);

    if (!this.isDispatching) {
      await this.dispatchPendingEvents();
    }
  }

  /**
   * ペンディング中のイベントをディスパッチする
   * エラーが発生しても他のハンドラーの実行は継続する
   */
  private async dispatchPendingEvents(): Promise<void> {
    this.isDispatching = true;

    try {
      // Promise.resolve()で非同期実行を保証
      await Promise.resolve();

      while (this.pendingEvents.length > 0) {
        const events = [...this.pendingEvents];
        this.pendingEvents = [];

        for (const event of events) {
          const handlers = this.handlers.get(event.eventName) || [];

          // 各ハンドラーを並列実行
          const handlerPromises = handlers.map((handler) => this.executeHandler(handler, event));

          // すべてのハンドラーの実行を待つが、エラーがあっても続行
          await Promise.allSettled(handlerPromises);
        }
      }
    } finally {
      this.isDispatching = false;
    }
  }

  /**
   * 個別のハンドラーを実行する
   * エラーが発生した場合はログ出力（実際の実装では適切なロガーを使用）
   */
  private async executeHandler(
    handler: IEventHandler<DomainEvent>,
    event: DomainEvent,
  ): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      // エラーが発生してもイベント処理全体は継続
      console.error(`Error in event handler for ${event.eventName}:`, error);
      // 実際の実装では適切なロガーやエラー通知機構を使用
    }
  }
}
