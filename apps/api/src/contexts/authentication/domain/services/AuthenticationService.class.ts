import { injectable, inject } from 'tsyringe';
import {
  createUserId,
  TierLevel,
  calculateRetryAfterSecondsFromResetTime,
  type ILogger,
} from '@nara-opendata/shared-kernel';
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
import { TYPES } from '../../../../types/di';
import type {
  IJWTPayload,
  TokenErrorReason,
  AuthenticationErrorReason,
  IRateLimitCheckResult,
  IRateLimitState,
  AuthenticationResult,
} from './AuthenticationService';

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
 * 認証に関するドメインサービス（クラス版）
 *
 * @remarks
 * DIコンテナで使用するためにクラスとして実装
 * 元のオブジェクトリテラル版と同じインターフェースを提供
 */
@injectable()
export class AuthenticationServiceClass {
  constructor(@inject(TYPES.ILogger) private readonly logger: ILogger) {}

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
        this.logger.warn(tierResult.warning);
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
  }

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
  }

  /**
   * レート制限を確認する（改善版）
   * @param user - 認証済みユーザー
   * @param rateLimitState - レート制限の現在の状態
   * @param currentTime - 現在時刻（テスト用にオプショナル）
   * @returns レート制限の確認結果
   */
  checkRateLimit(
    user: AuthenticatedUser,
    rateLimitState: IRateLimitState | null,
    currentTime: Date = new Date(),
  ): IRateLimitCheckResult {
    const rateLimit = getAuthenticatedUserRateLimit(user);
    const limit = getRateLimitValue(rateLimit);
    const windowSeconds = getRateLimitWindowSeconds(rateLimit);

    // 新規ユーザーまたは記録がない場合
    if (!rateLimitState) {
      return {
        allowed: true,
        currentCount: 0,
        limit,
        resetTime: new Date(currentTime.getTime() + windowSeconds * 1000),
        remainingSeconds: windowSeconds,
        remainingRequests: limit,
      };
    }

    // ウィンドウの計算
    const windowStartTime = rateLimitState.windowStartTime;
    const windowEndTime = new Date(windowStartTime.getTime() + windowSeconds * 1000);

    // 現在のウィンドウ内の場合
    if (currentTime < windowEndTime) {
      const remainingSeconds = Math.ceil((windowEndTime.getTime() - currentTime.getTime()) / 1000);
      const allowed = rateLimitState.requestCount < limit;
      const remainingRequests = Math.max(0, limit - rateLimitState.requestCount);

      return {
        allowed,
        currentCount: rateLimitState.requestCount,
        limit,
        resetTime: windowEndTime,
        remainingSeconds,
        remainingRequests,
      };
    }

    // ウィンドウが経過している場合（新しいウィンドウ）
    return {
      allowed: true,
      currentCount: 0,
      limit,
      resetTime: new Date(currentTime.getTime() + windowSeconds * 1000),
      remainingSeconds: windowSeconds,
      remainingRequests: limit,
    };
  }

  /**
   * レート制限エラー時のretry-after秒数を計算する
   * @param resetTime - レート制限がリセットされる時刻
   * @param currentTime - 現在時刻（テスト用にオプショナル）
   * @returns retry-after秒数（最小1秒）
   */
  calculateRetryAfterSeconds(resetTime: Date, currentTime: Date = new Date()): number {
    return calculateRetryAfterSecondsFromResetTime(resetTime, currentTime);
  }
}
