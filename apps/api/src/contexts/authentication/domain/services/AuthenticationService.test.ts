import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthenticationService, type IJWTPayload } from './AuthenticationService';
import {
  RateLimitSource,
  getRateLimitValue,
  getRateLimitWindowSeconds,
  getRateLimitSource,
} from '../models/RateLimit';

describe('AuthenticationService', () => {
  const validUserId = '123e4567-e89b-12d3-a456-426614174000';

  describe('createUserFromJWT', () => {
    it('最小限のペイロードからユーザーを作成できる', () => {
      const payload: IJWTPayload = {
        sub: validUserId,
      };

      const user = AuthenticationService.createUserFromJWT(payload);

      expect(user.userId).toBe(validUserId);
      expect(getRateLimitValue(user.rateLimit)).toBe(60); // TIER1のデフォルト
      expect(getRateLimitWindowSeconds(user.rateLimit)).toBe(60);
      expect(getRateLimitSource(user.rateLimit)).toBe(RateLimitSource.TIER1_DEFAULT);
    });

    it('ティア情報を含むペイロードからユーザーを作成できる', () => {
      const payload: IJWTPayload = {
        sub: validUserId,
        app_metadata: {
          tier: 'TIER2',
        },
      };

      const user = AuthenticationService.createUserFromJWT(payload);

      expect(user.userId).toBe(validUserId);
      expect(getRateLimitValue(user.rateLimit)).toBe(120); // TIER2のデフォルト
      expect(getRateLimitWindowSeconds(user.rateLimit)).toBe(60);
      expect(getRateLimitSource(user.rateLimit)).toBe(RateLimitSource.TIER2_DEFAULT);
    });

    it('カスタムレート制限を含むペイロードからユーザーを作成できる', () => {
      const payload: IJWTPayload = {
        sub: validUserId,
        app_metadata: {
          tier: 'TIER1',
          custom_rate_limit: {
            limit: 500,
            window_seconds: 60,
          },
        },
      };

      const user = AuthenticationService.createUserFromJWT(payload);

      expect(user.userId).toBe(validUserId);
      expect(getRateLimitValue(user.rateLimit)).toBe(500);
      expect(getRateLimitWindowSeconds(user.rateLimit)).toBe(60);
      expect(getRateLimitSource(user.rateLimit)).toBe(RateLimitSource.CUSTOM);
    });

    it('無効なユーザーIDの場合エラーになる', () => {
      const payload: IJWTPayload = {
        sub: 'invalid-uuid',
      };

      expect(() => AuthenticationService.createUserFromJWT(payload)).toThrow(
        'UserId must be a valid UUID',
      );
    });

    it('無効なティアの場合TIER1をデフォルトとして使用し、警告をログに出力する', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const payload: IJWTPayload = {
        sub: validUserId,
        app_metadata: {
          tier: 'TIER99',
        },
      };

      const user = AuthenticationService.createUserFromJWT(payload);

      expect(user.userId).toBe(validUserId);
      expect(getRateLimitValue(user.rateLimit)).toBe(60); // TIER1のデフォルト
      expect(getRateLimitWindowSeconds(user.rateLimit)).toBe(60);
      expect(getRateLimitSource(user.rateLimit)).toBe(RateLimitSource.TIER1_DEFAULT);

      // 警告が出力されることを確認
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unknown tier value: "TIER99", defaulting to TIER1',
      );

      consoleWarnSpy.mockRestore();
    });

    it('ティア値はcase insensitiveで処理される', () => {
      // 小文字のティア
      const payloadLower: IJWTPayload = {
        sub: validUserId,
        app_metadata: {
          tier: 'tier2',
        },
      };
      const userLower = AuthenticationService.createUserFromJWT(payloadLower);
      expect(getRateLimitValue(userLower.rateLimit)).toBe(120);
      expect(getRateLimitSource(userLower.rateLimit)).toBe(RateLimitSource.TIER2_DEFAULT);

      // 混在ケースのティア
      const payloadMixed: IJWTPayload = {
        sub: validUserId,
        app_metadata: {
          tier: 'Tier3',
        },
      };
      const userMixed = AuthenticationService.createUserFromJWT(payloadMixed);
      expect(getRateLimitValue(userMixed.rateLimit)).toBe(300);
      expect(getRateLimitSource(userMixed.rateLimit)).toBe(RateLimitSource.TIER3_DEFAULT);

      // 前後の空白も除去される
      const payloadSpaces: IJWTPayload = {
        sub: validUserId,
        app_metadata: {
          tier: '  TIER1  ',
        },
      };
      const userSpaces = AuthenticationService.createUserFromJWT(payloadSpaces);
      expect(getRateLimitValue(userSpaces.rateLimit)).toBe(60);
      expect(getRateLimitSource(userSpaces.rateLimit)).toBe(RateLimitSource.TIER1_DEFAULT);
    });
  });

  describe('isTokenExpired', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('期限切れのトークンを検出する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) - 1, // 1秒前に期限切れ
      };

      expect(AuthenticationService.isTokenExpired(payload)).toBe(true);
    });

    it('有効なトークンを検出する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600, // 1時間後に期限切れ
      };

      expect(AuthenticationService.isTokenExpired(payload)).toBe(false);
    });

    it('expがない場合は期限切れとして扱う', () => {
      const payload: IJWTPayload = {
        sub: validUserId,
      };

      expect(AuthenticationService.isTokenExpired(payload)).toBe(true);
    });
  });

  describe('isTokenFromFuture', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('未来のトークンを検出する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        iat: Math.floor(now.getTime() / 1000) + 120, // 2分後に発行
      };

      expect(AuthenticationService.isTokenFromFuture(payload)).toBe(true);
    });

    it('現在または過去のトークンを許可する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        iat: Math.floor(now.getTime() / 1000) - 60, // 1分前に発行
      };

      expect(AuthenticationService.isTokenFromFuture(payload)).toBe(false);
    });

    it('時刻ずれの許容範囲内は許可する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        iat: Math.floor(now.getTime() / 1000) + 30, // 30秒後に発行（許容範囲内）
      };

      expect(AuthenticationService.isTokenFromFuture(payload)).toBe(false);
    });

    it('iatがない場合は許可する', () => {
      const payload: IJWTPayload = {
        sub: validUserId,
      };

      expect(AuthenticationService.isTokenFromFuture(payload)).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('レート制限内のリクエストを許可する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = { sub: validUserId };
      const user = AuthenticationService.createUserFromJWT(payload);
      const windowStartTime = new Date('2024-01-01T11:59:30Z'); // 30秒前

      const result = AuthenticationService.checkRateLimit(user, 30, windowStartTime);

      expect(result.allowed).toBe(true);
      expect(result.resetTime).toEqual(new Date('2024-01-01T12:00:30Z')); // 60秒ウィンドウ
    });

    it('レート制限を超えたリクエストを拒否する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = { sub: validUserId };
      const user = AuthenticationService.createUserFromJWT(payload);
      const windowStartTime = new Date('2024-01-01T11:59:30Z');

      const result = AuthenticationService.checkRateLimit(user, 60, windowStartTime); // 制限値に達している

      expect(result.allowed).toBe(false);
      expect(result.resetTime).toEqual(new Date('2024-01-01T12:00:30Z'));
    });

    it('ウィンドウが過ぎた場合は新しいウィンドウを開始する', () => {
      const now = new Date('2024-01-01T12:01:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = { sub: validUserId };
      const user = AuthenticationService.createUserFromJWT(payload);
      const windowStartTime = new Date('2024-01-01T11:59:00Z'); // 2分前

      const result = AuthenticationService.checkRateLimit(user, 100, windowStartTime);

      expect(result.allowed).toBe(true);
      expect(result.resetTime).toEqual(new Date('2024-01-01T12:02:00Z')); // 新しいウィンドウ
    });
  });

  describe('calculateRetryAfterSeconds', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('リセット時刻までの秒数を計算する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const resetTime = new Date('2024-01-01T12:00:30Z');
      const seconds = AuthenticationService.calculateRetryAfterSeconds(resetTime);

      expect(seconds).toBe(30);
    });

    it('過去のリセット時刻の場合は0を返す', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const resetTime = new Date('2024-01-01T11:59:30Z');
      const seconds = AuthenticationService.calculateRetryAfterSeconds(resetTime);

      expect(seconds).toBe(0);
    });
  });
});
