import type { DomainEvent } from './DomainEvent';

/**
 * イベントハンドラーのインターフェース
 * @template T 処理するイベントの型
 */
export interface IEventHandler<T extends DomainEvent> {
  /**
   * イベントを処理する
   * @param event 処理するイベント
   */
  handle(event: T): Promise<void>;

  /**
   * このハンドラーが処理するイベント名を取得する
   */
  getEventName(): string;
}
