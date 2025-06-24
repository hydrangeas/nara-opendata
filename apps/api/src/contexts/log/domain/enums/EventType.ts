/**
 * 認証イベントタイプ
 * 認証に関連するイベントの種類を定義
 */
export enum EventType {
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
 * イベントタイプが成功イベントかチェックする
 */
export function isSuccessfulEventType(eventType: EventType): boolean {
  return eventType === EventType.LOGIN || eventType === EventType.TOKEN_REFRESH;
}
