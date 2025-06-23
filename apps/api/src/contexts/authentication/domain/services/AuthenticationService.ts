import { createUserId } from '@nara-opendata/shared-kernel';
import { AuthenticatedUser } from '../models/AuthenticatedUser';
import {
  createDefaultRateLimit,
  createCustomRateLimit,
  getRateLimitWindowSeconds,
  getRateLimitValue,
} from '../models/RateLimit';

/**
 * JWTトークンのペイロード型
 */
export interface IJWTPayload {
  sub: string;
  email?: string;
  app_metadata?: {
    tier?: string;
    custom_rate_limit?: {
      limit: number;
      window_seconds: number;
    };
  };
  exp?: number;
  iat?: number;
}

/**
 * 認証に関するドメインサービス
 */
export const AuthenticationService = {
  /**
   * JWTペイロードからAuthenticatedUserを作成する
   */
  createUserFromJWT(payload: IJWTPayload): AuthenticatedUser {
    // ユーザーIDの抽出
    const userId = createUserId(payload.sub);

    // カスタムレート制限の確認
    const customRateLimitData = payload.app_metadata?.custom_rate_limit;
    if (customRateLimitData) {
      const rateLimit = createCustomRateLimit(
        customRateLimitData.limit,
        customRateLimitData.window_seconds,
      );
      return AuthenticatedUser.create(userId, rateLimit);
    }

    // デフォルトレート制限を使用
    const tier = payload.app_metadata?.tier || 'TIER1';
    const rateLimit = createDefaultRateLimit(tier);
    return AuthenticatedUser.create(userId, rateLimit);
  },

  /**
   * トークンの有効期限を検証する
   */
  isTokenExpired(payload: IJWTPayload): boolean {
    if (!payload.exp) {
      return true; // 有効期限がない場合は期限切れとして扱う
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  },

  /**
   * トークンの発行時刻を検証する（未来のトークンを拒否）
   */
  isTokenFromFuture(payload: IJWTPayload): boolean {
    if (!payload.iat) {
      return false; // 発行時刻がない場合は許可
    }

    const now = Math.floor(Date.now() / 1000);
    const clockSkew = 60; // 60秒の時刻ずれを許容
    return payload.iat > now + clockSkew;
  },

  /**
   * レート制限を確認する
   * @returns 制限内の場合true、制限を超えた場合false
   */
  checkRateLimit(
    user: AuthenticatedUser,
    currentRequestCount: number,
    windowStartTime: Date,
  ): { allowed: boolean; resetTime: Date } {
    const now = new Date();
    const windowSeconds = getRateLimitWindowSeconds(user.rateLimit);
    const limit = getRateLimitValue(user.rateLimit);
    const windowEndTime = new Date(windowStartTime.getTime() + windowSeconds * 1000);

    // ウィンドウが過ぎている場合は新しいウィンドウ
    if (now >= windowEndTime) {
      return {
        allowed: true,
        resetTime: new Date(now.getTime() + windowSeconds * 1000),
      };
    }

    // 現在のウィンドウ内でのチェック
    const allowed = currentRequestCount < limit;
    return {
      allowed,
      resetTime: windowEndTime,
    };
  },

  /**
   * 次のリクエストが可能になるまでの秒数を計算する
   */
  calculateRetryAfterSeconds(resetTime: Date): number {
    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / 1000));
  },
} as const;
