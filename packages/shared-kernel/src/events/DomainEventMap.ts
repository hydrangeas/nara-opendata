import type { DomainEvent } from './DomainEvent';

/**
 * ドメインイベントマップのインターフェース
 *
 * このインターフェースを拡張して、アプリケーション固有のイベントマッピングを定義します。
 *
 * @example
 * ```typescript
 * // アプリケーション側での定義
 * declare module '@nara-opendata/shared-kernel' {
 *   interface DomainEventMap {
 *     UserCreated: UserCreatedEvent;
 *     OrderPlaced: OrderPlacedEvent;
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/consistent-indexed-object-style
export interface DomainEventMap {
  // デフォルトは空、アプリケーション側で拡張
  [key: string]: DomainEvent;
}

/**
 * イベント名の型
 */
export type EventName = keyof DomainEventMap;

/**
 * イベント名からイベント型を取得する型
 */
export type EventType<T extends EventName> = DomainEventMap[T];
