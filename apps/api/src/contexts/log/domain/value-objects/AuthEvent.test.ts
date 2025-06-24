import { describe, it, expect } from 'vitest';
import {
  createAuthEvent,
  getAuthEventType,
  equalsAuthEvent,
  isSuccessfulAuthEvent,
  AuthEventType,
} from './AuthEvent';

describe('AuthEvent', () => {
  describe('createAuthEvent', () => {
    it('各種イベントタイプで認証イベントを作成できる', () => {
      const loginEvent = createAuthEvent(AuthEventType.LOGIN);
      expect(getAuthEventType(loginEvent)).toBe(AuthEventType.LOGIN);

      const logoutEvent = createAuthEvent(AuthEventType.LOGOUT);
      expect(getAuthEventType(logoutEvent)).toBe(AuthEventType.LOGOUT);

      const refreshEvent = createAuthEvent(AuthEventType.TOKEN_REFRESH);
      expect(getAuthEventType(refreshEvent)).toBe(AuthEventType.TOKEN_REFRESH);

      const expiredEvent = createAuthEvent(AuthEventType.TOKEN_EXPIRED);
      expect(getAuthEventType(expiredEvent)).toBe(AuthEventType.TOKEN_EXPIRED);
    });
  });

  describe('equalsAuthEvent', () => {
    it('同じイベントタイプは等しい', () => {
      const event1 = createAuthEvent(AuthEventType.LOGIN);
      const event2 = createAuthEvent(AuthEventType.LOGIN);
      expect(equalsAuthEvent(event1, event2)).toBe(true);
    });

    it('異なるイベントタイプは等しくない', () => {
      const loginEvent = createAuthEvent(AuthEventType.LOGIN);
      const logoutEvent = createAuthEvent(AuthEventType.LOGOUT);
      expect(equalsAuthEvent(loginEvent, logoutEvent)).toBe(false);
    });
  });

  describe('isSuccessfulAuthEvent', () => {
    it('LOGINイベントは成功イベント', () => {
      const event = createAuthEvent(AuthEventType.LOGIN);
      expect(isSuccessfulAuthEvent(event)).toBe(true);
    });

    it('TOKEN_REFRESHイベントは成功イベント', () => {
      const event = createAuthEvent(AuthEventType.TOKEN_REFRESH);
      expect(isSuccessfulAuthEvent(event)).toBe(true);
    });

    it('LOGOUTイベントは成功イベントではない', () => {
      const event = createAuthEvent(AuthEventType.LOGOUT);
      expect(isSuccessfulAuthEvent(event)).toBe(false);
    });

    it('TOKEN_EXPIREDイベントは成功イベントではない', () => {
      const event = createAuthEvent(AuthEventType.TOKEN_EXPIRED);
      expect(isSuccessfulAuthEvent(event)).toBe(false);
    });
  });

  describe('ユースケース', () => {
    it('認証ログエントリでイベントタイプを記録できる', () => {
      // ユーザーがログインした
      const loginEvent = createAuthEvent(AuthEventType.LOGIN);

      // ログエントリに記録（実際はAuthLogEntryで使用）
      const logData = {
        event: loginEvent,
        timestamp: new Date(),
        userId: 'user-123',
      };

      // イベントタイプで処理を分岐
      if (isSuccessfulAuthEvent(logData.event)) {
        // セッション作成などの処理
        expect(getAuthEventType(logData.event)).toBe(AuthEventType.LOGIN);
      }
    });

    it('トークンのライフサイクルを追跡できる', () => {
      const events = [
        createAuthEvent(AuthEventType.LOGIN), // 初回ログイン
        createAuthEvent(AuthEventType.TOKEN_REFRESH), // トークン更新
        createAuthEvent(AuthEventType.TOKEN_REFRESH), // 再度更新
        createAuthEvent(AuthEventType.TOKEN_EXPIRED), // 期限切れ
        createAuthEvent(AuthEventType.LOGOUT), // ログアウト
      ];

      // 成功イベントの数をカウント
      const successCount = events.filter(isSuccessfulAuthEvent).length;
      expect(successCount).toBe(3); // LOGIN + 2回のTOKEN_REFRESH
    });
  });
});
