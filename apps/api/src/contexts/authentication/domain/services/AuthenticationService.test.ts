import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AuthenticationServiceClass } from './AuthenticationService.class';
import type { IJWTPayload, IRateLimitState } from './AuthenticationService';
import {
  getUserId,
  getRateLimit as getAuthenticatedUserRateLimit,
} from '../value-objects/AuthenticatedUser';
import {
  RateLimitSource,
  getRateLimitValue,
  getRateLimitWindowSeconds,
  getRateLimitSource,
} from '../value-objects/RateLimit';
import { setupTestContainer, teardownTestContainer } from '../../../../test-utils/di-helpers';
import { resolve } from '../../../../container';
import { TYPES } from '../../../../types/di';
import type { ILogger } from '@nara-opendata/shared-kernel';

describe('AuthenticationService', () => {
  const validUserId = '123e4567-e89b-12d3-a456-426614174000';
  let authenticationService: AuthenticationServiceClass;
  let mockLogger: ILogger;

  beforeEach(() => {
    setupTestContainer();
    mockLogger = resolve<ILogger>(TYPES.ILogger);
    authenticationService = resolve<AuthenticationServiceClass>(TYPES.AuthenticationService);
  });

  afterEach(() => {
    teardownTestContainer();
  });

  describe('createAuthenticatedUserFromJWT', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('有効なトークンから最小限のペイロードでユーザーを作成できる', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600, // 1時間後に期限切れ
      };

      const result = authenticationService.createAuthenticatedUserFromJWT(payload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(getUserId(result.user)).toBe(validUserId);
        const userRateLimit = getAuthenticatedUserRateLimit(result.user);
        expect(getRateLimitValue(userRateLimit)).toBe(60); // TIER1のデフォルト
        expect(getRateLimitWindowSeconds(userRateLimit)).toBe(60);
        expect(getRateLimitSource(userRateLimit)).toBe(RateLimitSource.TIER1_DEFAULT);
      }
    });

    it('ティア情報を含むペイロードからユーザーを作成できる', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
        app_metadata: {
          tier: 'TIER2',
        },
      };

      const result = authenticationService.createAuthenticatedUserFromJWT(payload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(getUserId(result.user)).toBe(validUserId);
        const userRateLimit = getAuthenticatedUserRateLimit(result.user);
        expect(getRateLimitValue(userRateLimit)).toBe(120); // TIER2のデフォルト
        expect(getRateLimitWindowSeconds(userRateLimit)).toBe(60);
        expect(getRateLimitSource(userRateLimit)).toBe(RateLimitSource.TIER2_DEFAULT);
      }
    });

    it('カスタムレート制限を含むペイロードからユーザーを作成できる', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
        app_metadata: {
          tier: 'TIER1',
          custom_rate_limit: {
            limit: 500,
            window_seconds: 60,
          },
        },
      };

      const result = authenticationService.createAuthenticatedUserFromJWT(payload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(getUserId(result.user)).toBe(validUserId);
        const userRateLimit = getAuthenticatedUserRateLimit(result.user);
        expect(getRateLimitValue(userRateLimit)).toBe(500);
        expect(getRateLimitWindowSeconds(userRateLimit)).toBe(60);
        expect(getRateLimitSource(userRateLimit)).toBe(RateLimitSource.CUSTOM);
      }
    });

    it('無効なユーザーIDの場合エラーになる', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: 'invalid-uuid',
        exp: Math.floor(now.getTime() / 1000) + 3600,
      };

      const result = authenticationService.createAuthenticatedUserFromJWT(payload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_PAYLOAD');
        expect(result.error.reason).toBe('invalid_user_id');
        expect(result.error.message).toContain('valid UUID');
      }
    });

    it('無効なティアの場合TIER1をデフォルトとして使用し、警告をログに出力する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);
      const loggerWarnSpy = vi.spyOn(mockLogger, 'warn');

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
        app_metadata: {
          tier: 'TIER99',
        },
      };

      const result = authenticationService.createAuthenticatedUserFromJWT(payload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(getUserId(result.user)).toBe(validUserId);
        const userRateLimit = getAuthenticatedUserRateLimit(result.user);
        expect(getRateLimitValue(userRateLimit)).toBe(60); // TIER1のデフォルト
        expect(getRateLimitWindowSeconds(userRateLimit)).toBe(60);
        expect(getRateLimitSource(userRateLimit)).toBe(RateLimitSource.TIER1_DEFAULT);
      }

      // 警告が出力されることを確認
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Unknown tier value: "TIER99", defaulting to TIER1',
      );
    });

    it('ティア値はcase insensitiveで処理される', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      // 小文字のティア
      const payloadLower: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
        app_metadata: {
          tier: 'tier2',
        },
      };
      const resultLower = authenticationService.createAuthenticatedUserFromJWT(payloadLower);
      expect(resultLower.success).toBe(true);
      if (resultLower.success) {
        const userRateLimit = getAuthenticatedUserRateLimit(resultLower.user);
        expect(getRateLimitValue(userRateLimit)).toBe(120);
        expect(getRateLimitSource(userRateLimit)).toBe(RateLimitSource.TIER2_DEFAULT);
      }

      // 混在ケースのティア
      const payloadMixed: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
        app_metadata: {
          tier: 'Tier3',
        },
      };
      const resultMixed = authenticationService.createAuthenticatedUserFromJWT(payloadMixed);
      expect(resultMixed.success).toBe(true);
      if (resultMixed.success) {
        const userRateLimit = getAuthenticatedUserRateLimit(resultMixed.user);
        expect(getRateLimitValue(userRateLimit)).toBe(300);
        expect(getRateLimitSource(userRateLimit)).toBe(RateLimitSource.TIER3_DEFAULT);
      }

      // 前後の空白も除去される
      const payloadSpaces: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
        app_metadata: {
          tier: '  TIER1  ',
        },
      };
      const resultSpaces = authenticationService.createAuthenticatedUserFromJWT(payloadSpaces);
      expect(resultSpaces.success).toBe(true);
      if (resultSpaces.success) {
        const userRateLimit = getAuthenticatedUserRateLimit(resultSpaces.user);
        expect(getRateLimitValue(userRateLimit)).toBe(60);
        expect(getRateLimitSource(userRateLimit)).toBe(RateLimitSource.TIER1_DEFAULT);
      }
    });
    it('期限切れトークンの場合エラーを返す', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) - 1, // 1秒前に期限切れ
      };

      const result = authenticationService.createAuthenticatedUserFromJWT(payload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_TOKEN');
        expect(result.error.reason).toBe('expired');
        expect(result.error.message).toBe('Token has expired');
      }
    });

    it('未来のトークンの場合エラーを返す', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
        iat: Math.floor(now.getTime() / 1000) + 120, // 2分後に発行
      };

      const result = authenticationService.createAuthenticatedUserFromJWT(payload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_TOKEN');
        expect(result.error.reason).toBe('not_yet_valid');
        expect(result.error.message).toBe('Token is not yet valid');
      }
    });

    it('有効期限がないトークンの場合エラーを返す', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        // exp がない
      };

      const result = authenticationService.createAuthenticatedUserFromJWT(payload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_TOKEN');
        expect(result.error.reason).toBe('missing_exp');
        expect(result.error.message).toBe('Token is missing expiration time');
      }
    });
  });

  describe('validateTokenTiming', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('有効なトークンを検証する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600, // 1時間後に期限切れ
        iat: Math.floor(now.getTime() / 1000) - 60, // 1分前に発行
      };

      const result = authenticationService.validateTokenTiming(payload);
      expect(result.isValid).toBe(true);
      if (!result.isValid) {
        expect(result.reason).toBeUndefined();
      }
    });

    it('期限切れのトークンを検出する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) - 1, // 1秒前に期限切れ
      };

      const result = authenticationService.validateTokenTiming(payload);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.reason).toBe('expired');
        expect(result.details?.exp).toBe(payload.exp);
        expect(result.details?.now).toBe(Math.floor(now.getTime() / 1000));
      }
    });

    it('未来のトークンを検出する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
        iat: Math.floor(now.getTime() / 1000) + 120, // 2分後に発行（clockSkew 60秒を超える）
      };

      const result = authenticationService.validateTokenTiming(payload);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.reason).toBe('not_yet_valid');
        expect(result.details?.iat).toBe(payload.iat);
        expect(result.details?.now).toBe(Math.floor(now.getTime() / 1000));
      }
    });

    it('有効期限がないトークンを無効と判定する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        // exp がない
      };

      const result = authenticationService.validateTokenTiming(payload);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.reason).toBe('missing_exp');
        expect(result.details?.now).toBe(Math.floor(now.getTime() / 1000));
      }
    });

    it('発行時刻がなくても有効期限があれば有効と判定する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
        // iat がない
      };

      const result = authenticationService.validateTokenTiming(payload);
      expect(result.isValid).toBe(true);
    });

    it('clockSkew内の未来のトークンは有効と判定する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
        iat: Math.floor(now.getTime() / 1000) + 30, // 30秒後に発行（clockSkew 60秒以内）
      };

      const result = authenticationService.validateTokenTiming(payload);
      expect(result.isValid).toBe(true);
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('レート制限内のリクエストを許可し、詳細情報を返す', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
      };
      const authResult = authenticationService.createAuthenticatedUserFromJWT(payload);
      expect(authResult.success).toBe(true);
      if (!authResult.success) throw new Error('Failed to create user');

      const state: IRateLimitState = {
        userId: validUserId,
        requestCount: 30,
        windowStartTime: new Date('2024-01-01T11:59:30Z'), // 30秒前
      };

      const result = authenticationService.checkRateLimit(authResult.user, state);

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(30);
      expect(result.limit).toBe(60);
      expect(result.resetTime).toEqual(new Date('2024-01-01T12:00:30Z')); // 60秒ウィンドウ
      expect(result.remainingSeconds).toBe(30);
      expect(result.remainingRequests).toBe(30); // 60 - 30 = 30
    });

    it('レート制限を超えたリクエストを拒否し、詳細情報を返す', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
      };
      const authResult = authenticationService.createAuthenticatedUserFromJWT(payload);
      expect(authResult.success).toBe(true);
      if (!authResult.success) throw new Error('Failed to create user');

      const state: IRateLimitState = {
        userId: validUserId,
        requestCount: 60, // 制限値に達している
        windowStartTime: new Date('2024-01-01T11:59:30Z'),
      };

      const result = authenticationService.checkRateLimit(authResult.user, state);

      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(60);
      expect(result.limit).toBe(60);
      expect(result.resetTime).toEqual(new Date('2024-01-01T12:00:30Z'));
      expect(result.remainingSeconds).toBe(30);
      expect(result.remainingRequests).toBe(0);
    });

    it('ウィンドウが過ぎた場合は新しいウィンドウ情報を返す', () => {
      const now = new Date('2024-01-01T12:01:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
      };
      const authResult = authenticationService.createAuthenticatedUserFromJWT(payload);
      expect(authResult.success).toBe(true);
      if (!authResult.success) throw new Error('Failed to create user');

      const state: IRateLimitState = {
        userId: validUserId,
        requestCount: 100,
        windowStartTime: new Date('2024-01-01T11:59:00Z'), // 2分前
      };

      const result = authenticationService.checkRateLimit(authResult.user, state);

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(0); // 新しいウィンドウ
      expect(result.limit).toBe(60);
      expect(result.resetTime).toEqual(new Date('2024-01-01T12:02:00Z')); // 新しいウィンドウ
      expect(result.remainingSeconds).toBe(60);
      expect(result.remainingRequests).toBe(60);
    });

    it('カスタムレート制限で正しく動作する', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const payload: IJWTPayload = {
        sub: validUserId,
        exp: Math.floor(now.getTime() / 1000) + 3600,
        app_metadata: {
          custom_rate_limit: {
            limit: 500,
            window_seconds: 120,
          },
        },
      };
      const authResult = authenticationService.createAuthenticatedUserFromJWT(payload);
      expect(authResult.success).toBe(true);
      if (!authResult.success) throw new Error('Failed to create user');

      const state: IRateLimitState = {
        userId: validUserId,
        requestCount: 250,
        windowStartTime: new Date('2024-01-01T11:59:00Z'), // 1分前
      };

      const result = authenticationService.checkRateLimit(authResult.user, state);

      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(250);
      expect(result.limit).toBe(500);
      expect(result.resetTime).toEqual(new Date('2024-01-01T12:01:00Z')); // 120秒ウィンドウ
      expect(result.remainingSeconds).toBe(60);
      expect(result.remainingRequests).toBe(250); // 500 - 250 = 250
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
      const seconds = authenticationService.calculateRetryAfterSeconds(resetTime);

      expect(seconds).toBe(30);
    });

    it('過去のリセット時刻の場合は0を返す', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const resetTime = new Date('2024-01-01T11:59:30Z');
      const seconds = authenticationService.calculateRetryAfterSeconds(resetTime);

      expect(seconds).toBe(0);
    });
  });
});
