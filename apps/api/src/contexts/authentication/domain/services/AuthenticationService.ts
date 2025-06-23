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
 * 認証エラー情報
 */
export interface IAuthenticationError {
  type: 'INVALID_TOKEN' | 'INVALID_PAYLOAD';
  reason: 'expired' | 'not_yet_valid' | 'missing_exp' | 'invalid_user_id';
  message: string;
  details?: unknown;
}

/**
 * レート制限の確認結果
 */
export interface IRateLimitCheckResult {
  /** リクエストが許可されるかどうか */
  allowed: boolean;
  /** 現在のリクエスト数 */
  currentCount: number;
  /** レート制限の上限値 */
  limit: number;
  /** レート制限がリセットされる時刻 */
  resetTime: Date;
  /** リセットまでの残り秒数 */
  remainingSeconds: number;
  /** 残りリクエスト可能数（制限に達している場合は0） */
  remainingRequests: number;
}

/**
 * レート制限の状態（永続化層で管理される情報）
 */
export interface IRateLimitState {
  /** ユーザーID */
  userId: string;
  /** 現在のウィンドウでのリクエスト数 */
  requestCount: number;
  /** 現在のウィンドウの開始時刻 */
  windowStartTime: Date;
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
   * JWTペイロードから検証済みのAuthenticatedUserを作成する
   * @returns 成功時はAuthenticatedUser、失敗時はエラー情報を含むResult型
   */
  createAuthenticatedUserFromJWT(
    payload: IJWTPayload,
  ): { success: true; user: AuthenticatedUser } | { success: false; error: IAuthenticationError } {
    // まずトークンの時刻検証を実行
    const timingValidation = this.validateTokenTiming(payload);
    if (!timingValidation.isValid) {
      return {
        success: false,
        error: {
          type: 'INVALID_TOKEN',
          reason: timingValidation.reason as 'expired' | 'not_yet_valid' | 'missing_exp',
          message: this.getErrorMessage(
            timingValidation.reason as 'expired' | 'not_yet_valid' | 'missing_exp',
          ),
          details: timingValidation.details,
        },
      };
    }

    try {
      // ユーザーIDの抽出
      const userId = createUserId(payload.sub);

      // カスタムレート制限の確認
      const customRateLimitData = payload.app_metadata?.custom_rate_limit;
      if (customRateLimitData) {
        const rateLimit = createCustomRateLimit(
          customRateLimitData.limit,
          customRateLimitData.window_seconds,
        );
        return {
          success: true,
          user: AuthenticatedUser.create(userId, rateLimit),
        };
      }

      // デフォルトレート制限を使用
      const tierLevel = parseTierLevel(payload.app_metadata?.tier);
      const rateLimit = createDefaultRateLimit(tierLevel);
      return {
        success: true,
        user: AuthenticatedUser.create(userId, rateLimit),
      };
    } catch (error) {
      // ユーザーID作成エラーなど
      return {
        success: false,
        error: {
          type: 'INVALID_PAYLOAD',
          reason: 'invalid_user_id',
          message: error instanceof Error ? error.message : 'Invalid JWT payload',
        },
      };
    }
  },

  /**
   * エラー理由に対応するメッセージを取得
   */
  getErrorMessage(reason: 'expired' | 'not_yet_valid' | 'missing_exp' | 'invalid_user_id'): string {
    const messages: Record<typeof reason, string> = {
      expired: 'Token has expired',
      not_yet_valid: 'Token is not yet valid',
      missing_exp: 'Token is missing expiration time',
      invalid_user_id: 'Invalid user ID in token',
    };
    return messages[reason];
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
   * レート制限を確認する（改善版）
   * @param user - 認証済みユーザー
   * @param state - 現在のレート制限状態
   * @returns 詳細な制限情報を含む結果
   */
  checkRateLimitWithState(user: AuthenticatedUser, state: IRateLimitState): IRateLimitCheckResult {
    const now = new Date();
    const windowSeconds = getRateLimitWindowSeconds(user.rateLimit);
    const limit = getRateLimitValue(user.rateLimit);
    const windowEndTime = new Date(state.windowStartTime.getTime() + windowSeconds * 1000);

    // ウィンドウが過ぎている場合は新しいウィンドウとして扱う
    if (now >= windowEndTime) {
      const newResetTime = new Date(now.getTime() + windowSeconds * 1000);
      return {
        allowed: true,
        currentCount: 0,
        limit,
        resetTime: newResetTime,
        remainingSeconds: windowSeconds,
        remainingRequests: limit,
      };
    }

    // 現在のウィンドウ内でのチェック
    const allowed = state.requestCount < limit;
    const remainingSeconds = Math.max(
      0,
      Math.ceil((windowEndTime.getTime() - now.getTime()) / 1000),
    );
    const remainingRequests = Math.max(0, limit - state.requestCount);

    return {
      allowed,
      currentCount: state.requestCount,
      limit,
      resetTime: windowEndTime,
      remainingSeconds,
      remainingRequests,
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
