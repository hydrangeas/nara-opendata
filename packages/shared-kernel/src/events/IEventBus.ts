import type { DomainEvent } from './DomainEvent';
import type { IEventHandler } from './IEventHandler';
import type { EventName, EventType } from './DomainEventMap';

/**
 * イベントバスのインターフェース
 */
export interface IEventBus {
  /**
   * イベントを発行する
   * @param event 発行するイベント
   */
  publish<K extends EventName>(event: EventType<K>): Promise<void>;

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
  subscribe<K extends EventName>(eventName: K, handler: IEventHandler<EventType<K>>): void;

  /**
   * イベントハンドラーの登録を解除する
   * @param eventName イベント名
   * @param handler イベントハンドラー
   */
  unsubscribe<K extends EventName>(eventName: K, handler: IEventHandler<EventType<K>>): void;

  /**
   * すべてのイベントハンドラーをクリアする
   */
  clearAllHandlers(): void;
}
