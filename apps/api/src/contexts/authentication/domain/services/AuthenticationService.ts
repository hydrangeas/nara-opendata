import { createUserId, TierLevel } from '@nara-opendata/shared-kernel';
import type { AuthenticatedUser } from '../value-objects/AuthenticatedUser';
import {
  createAuthenticatedUser,
  getRateLimit as getAuthenticatedUserRateLimit,
} from '../value-objects/AuthenticatedUser';
import {
  createDefaultRateLimit,
  createCustomRateLimit,
  getRateLimitWindowSeconds,
  getRateLimitValue,
} from '../value-objects/RateLimit';

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
 * トークン検証エラーの理由
 */
export type TokenErrorReason = 'expired' | 'not_yet_valid' | 'missing_exp';

/**
 * ペイロード検証エラーの理由
 */
export type PayloadErrorReason = 'invalid_user_id';

/**
 * 認証エラーの理由（すべて）
 */
export type AuthenticationErrorReason = TokenErrorReason | PayloadErrorReason;

/**
 * 認証エラー情報
 */
export interface IAuthenticationError {
  type: 'INVALID_TOKEN' | 'INVALID_PAYLOAD';
  reason: AuthenticationErrorReason;
  message: string;
  details?: {
    exp?: number | undefined; // トークンの有効期限（UNIX時刻）
    iat?: number | undefined; // トークンの発行時刻（UNIX時刻）
    now?: number | undefined; // 検証時の現在時刻（UNIX時刻）
    error?: unknown | undefined; // その他のエラー情報
  };
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
 * 認証成功時の結果
 */
export interface IAuthenticationSuccess {
  success: true;
  user: AuthenticatedUser;
}

/**
 * 認証失敗時の結果
 */
export interface IAuthenticationFailure {
  success: false;
  error: IAuthenticationError;
}

/**
 * 認証処理の結果
 */
export type AuthenticationResult = IAuthenticationSuccess | IAuthenticationFailure;

/**
 * 文字列からTierLevelへの安全な変換（判別共用体を使用）
 * @param tierString - 変換する文字列（case insensitive）
 * @returns 変換結果と警告情報
 */
function parseTierLevel(tierString: string | undefined): { level: TierLevel; warning?: string } {
  if (!tierString) {
    return { level: TierLevel.TIER1 };
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
    return {
      level: TierLevel.TIER1,
      warning: `Unknown tier value: "${tierString}", defaulting to TIER1`,
    };
  }

  return { level: tierLevel };
}

/**
 * エラー理由に対応するメッセージを取得
 */
function getErrorMessage(reason: AuthenticationErrorReason): string {
  const messages: Record<AuthenticationErrorReason, string> = {
    expired: 'Token has expired',
    not_yet_valid: 'Token is not yet valid',
    missing_exp: 'Token is missing expiration time',
    invalid_user_id: 'Invalid user ID in token',
  };
  return messages[reason];
}

/**
 * 認証結果が成功かどうかを判定する型ガード
 */
export function isAuthenticationSuccess(
  result: AuthenticationResult,
): result is IAuthenticationSuccess {
  return result.success === true;
}

/**
 * 認証結果が失敗かどうかを判定する型ガード
 */
export function isAuthenticationFailure(
  result: AuthenticationResult,
): result is IAuthenticationFailure {
  return result.success === false;
}

/**
 * 認証に関するドメインサービス
 */
export const AuthenticationService = {
  /**
   * JWTペイロードから検証済みのAuthenticatedUserを作成する
   * @returns 成功時はAuthenticatedUser、失敗時はエラー情報を含むResult型
   */
  createAuthenticatedUserFromJWT(payload: IJWTPayload): AuthenticationResult {
    // まずトークンの時刻検証を実行
    const timingValidation = this.validateTokenTiming(payload);
    if (!timingValidation.isValid) {
      return {
        success: false,
        error: {
          type: 'INVALID_TOKEN',
          reason: timingValidation.reason,
          message: getErrorMessage(timingValidation.reason),
          details: timingValidation.details || {},
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
          user: createAuthenticatedUser(userId, rateLimit),
        };
      }

      // デフォルトレート制限を使用
      const tierResult = parseTierLevel(payload.app_metadata?.tier);

      // 警告があればログ出力
      if (tierResult.warning) {
        // TODO: 本番環境では構造化ログを使用すべき
        console.warn(tierResult.warning);
      }

      const rateLimit = createDefaultRateLimit(tierResult.level);
      return {
        success: true,
        user: createAuthenticatedUser(userId, rateLimit),
      };
    } catch (error) {
      // ユーザーID作成エラーなど
      return {
        success: false,
        error: {
          type: 'INVALID_PAYLOAD',
          reason: 'invalid_user_id',
          message: error instanceof Error ? error.message : 'Invalid JWT payload',
          details: {
            error: error instanceof Error ? error.message : error,
          },
        },
      };
    }
  },

  /**
   * トークンの時刻関連の有効性を包括的に検証する
   * @returns 検証結果と理由
   */
  validateTokenTiming(payload: IJWTPayload):
    | { isValid: true }
    | {
        isValid: false;
        reason: TokenErrorReason;
        details: {
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
    const userRateLimit = getAuthenticatedUserRateLimit(user);
    const windowSeconds = getRateLimitWindowSeconds(userRateLimit);
    const limit = getRateLimitValue(userRateLimit);
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
