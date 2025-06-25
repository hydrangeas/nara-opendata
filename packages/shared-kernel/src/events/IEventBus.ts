import type { DomainEvent } from './DomainEvent';
import type { IEventHandler } from './IEventHandler';

/**
 * イベントバスのインターフェース
 */
export interface IEventBus {
  /**
   * イベントを発行する
   * @param event 発行するイベント
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * 複数のイベントを発行する
   * @param events 発行するイベントの配列
   */
  publishAll(events: DomainEvent[]): Promise<void>;

  /**
   * イベントハンドラーを登録する
   * @param eventName イベント名
   * @param handler イベントハンドラー
   */
  subscribe<T extends DomainEvent>(eventName: string, handler: IEventHandler<T>): void;

  /**
   * イベントハンドラーの登録を解除する
   * @param eventName イベント名
   * @param handler イベントハンドラー
   */
  unsubscribe<T extends DomainEvent>(eventName: string, handler: IEventHandler<T>): void;

  /**
   * すべてのイベントハンドラーをクリアする
   */
  clearAllHandlers(): void;
}
