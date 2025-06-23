import { createUserId, TierLevel } from '@nara-opendata/shared-kernel';
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
 * 文字列からTierLevelへの安全な変換
 * @param tierString - 変換する文字列（case insensitive）
 * @returns TierLevel - 不明な値の場合はTIER1を返す
 */
function parseTierLevel(tierString: string | undefined): TierLevel {
  if (!tierString) {
    return TierLevel.TIER1;
  }

  const normalizedTier = tierString.toUpperCase().trim();

  // 明示的なマッピング
  const tierMap: Record<string, TierLevel | undefined> = {
    TIER1: TierLevel.TIER1,
    TIER2: TierLevel.TIER2,
    TIER3: TierLevel.TIER3,
  };

  const tierLevel = tierMap[normalizedTier];

  if (!tierLevel) {
    // TODO: 本番環境では構造化ログを使用すべき
    console.warn(`Unknown tier value: "${tierString}", defaulting to TIER1`);
    return TierLevel.TIER1;
  }

  return tierLevel;
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
    const tierLevel = parseTierLevel(payload.app_metadata?.tier);
    const rateLimit = createDefaultRateLimit(tierLevel);
    return AuthenticatedUser.create(userId, rateLimit);
  },

  /**
   * トークンの時刻関連の有効性を包括的に検証する
   * @returns 検証結果と理由
   */
  validateTokenTiming(payload: IJWTPayload): {
    isValid: boolean;
    reason?: 'expired' | 'not_yet_valid' | 'missing_exp';
    details?: {
      exp?: number;
      iat?: number;
      now: number;
    };
  } {
    const now = Math.floor(Date.now() / 1000);

    // 有効期限の検証
    if (!payload.exp) {
      return {
        isValid: false,
        reason: 'missing_exp',
        details: { now },
      };
    }

    if (payload.exp < now) {
      return {
        isValid: false,
        reason: 'expired',
        details: { exp: payload.exp, now },
      };
    }

    // 発行時刻の検証（未来のトークンを拒否）
    if (payload.iat) {
      const clockSkew = 60; // 60秒の時刻ずれを許容
      if (payload.iat > now + clockSkew) {
        return {
          isValid: false,
          reason: 'not_yet_valid',
          details: { iat: payload.iat, now },
        };
      }
    }

    return { isValid: true };
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
