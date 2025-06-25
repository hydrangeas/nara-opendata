import { describe, it, expect } from 'vitest';
import {
  createAuthResult,
  getAuthResultValue,
  equalsAuthResult,
  isSuccessfulAuthResult,
  AuthResultValue,
  type AuthResult,
} from './AuthResult';

describe('AuthResult', () => {
  describe('createAuthResult', () => {
    it('成功の認証結果を作成できる', () => {
      const result = createAuthResult(AuthResultValue.SUCCESS);
      expect(getAuthResultValue(result)).toBe(AuthResultValue.SUCCESS);
    });

    it('失敗の認証結果を作成できる', () => {
      const result = createAuthResult(AuthResultValue.FAILURE);
      expect(getAuthResultValue(result)).toBe(AuthResultValue.FAILURE);
    });
  });

  describe('equalsAuthResult', () => {
    it('同じ結果値は等しい', () => {
      const result1 = createAuthResult(AuthResultValue.SUCCESS);
      const result2 = createAuthResult(AuthResultValue.SUCCESS);
      expect(equalsAuthResult(result1, result2)).toBe(true);
    });

    it('異なる結果値は等しくない', () => {
      const success = createAuthResult(AuthResultValue.SUCCESS);
      const failure = createAuthResult(AuthResultValue.FAILURE);
      expect(equalsAuthResult(success, failure)).toBe(false);
    });
  });

  describe('isSuccessfulAuthResult', () => {
    it('成功の結果はtrueを返す', () => {
      const result = createAuthResult(AuthResultValue.SUCCESS);
      expect(isSuccessfulAuthResult(result)).toBe(true);
    });

    it('失敗の結果はfalseを返す', () => {
      const result = createAuthResult(AuthResultValue.FAILURE);
      expect(isSuccessfulAuthResult(result)).toBe(false);
    });
  });

  describe('ユースケース', () => {
    it('認証ログで成功/失敗を記録できる', () => {
      const authAttempts = [
        { user: 'user1', result: createAuthResult(AuthResultValue.SUCCESS) },
        { user: 'user2', result: createAuthResult(AuthResultValue.FAILURE) },
        { user: 'user3', result: createAuthResult(AuthResultValue.SUCCESS) },
      ];

      // 成功した認証の数をカウント
      const successCount = authAttempts.filter((attempt) =>
        isSuccessfulAuthResult(attempt.result),
      ).length;
      expect(successCount).toBe(2);
    });

    it('認証結果に基づいて処理を分岐できる', () => {
      const handleAuth = (result: () => AuthResult) => {
        const authResult = result();
        if (isSuccessfulAuthResult(authResult)) {
          return 'セッションを作成しました';
        } else {
          return 'ログインに失敗しました';
        }
      };

      expect(handleAuth(() => createAuthResult(AuthResultValue.SUCCESS))).toBe(
        'セッションを作成しました',
      );
      expect(handleAuth(() => createAuthResult(AuthResultValue.FAILURE))).toBe(
        'ログインに失敗しました',
      );
    });
  });
});
