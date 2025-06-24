/**
 * 認証イベントタイプ
 * 認証に関連するイベントの種類を定義
 */
export enum AuthEventType {
  /**
   * ログイン
   */
  LOGIN = 'LOGIN',

  /**
   * ログアウト
   */
  LOGOUT = 'LOGOUT',

  /**
   * トークンリフレッシュ
   */
  TOKEN_REFRESH = 'TOKEN_REFRESH',

  /**
   * トークン期限切れ
   */
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
}

/**
 * 認証イベント属性
 */
export interface IAuthEventAttributes {
  type: AuthEventType;
}

/**
 * 認証イベントバリューオブジェクト
 * 認証に関連するイベントを表現
 */
export type AuthEvent = IAuthEventAttributes & { readonly brand: unique symbol };

/**
 * 認証イベントを作成する
 */
export function createAuthEvent(type: AuthEventType): AuthEvent {
  return { type } as AuthEvent;
}

/**
 * 認証イベントのタイプを取得する
 */
export function getAuthEventType(authEvent: AuthEvent): AuthEventType {
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
  return authEvent.type === AuthEventType.LOGIN || authEvent.type === AuthEventType.TOKEN_REFRESH;
}
