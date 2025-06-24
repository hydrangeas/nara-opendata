import type { EventType } from '../enums/EventType';
import { isSuccessfulEventType } from '../enums/EventType';

/**
 * 認証イベント属性
 */
export interface IAuthEventAttributes {
  type: EventType;
}

/**
 * 認証イベントバリューオブジェクト
 * 認証に関連するイベントを表現
 */
export type AuthEvent = IAuthEventAttributes & { readonly brand: unique symbol };

/**
 * 認証イベントを作成する
 */
export function createAuthEvent(type: EventType): AuthEvent {
  return { type } as AuthEvent;
}

/**
 * 認証イベントのタイプを取得する
 */
export function getAuthEventType(authEvent: AuthEvent): EventType {
  return authEvent.type;
}

/**
 * 認証イベントの等価性を判定する
 */
export function equalsAuthEvent(a: AuthEvent, b: AuthEvent): boolean {
  return a.type === b.type;
}

/**
 * 認証イベントが成功イベントかチェックする
 */
export function isSuccessfulAuthEvent(authEvent: AuthEvent): boolean {
  return isSuccessfulEventType(authEvent.type);
}
