import type { AuthenticatedUser } from '../value-objects/AuthenticatedUser';
import { AuthenticationServiceClass } from './AuthenticationService.class';

/**
 * JWTトークンのペイロード型
 */
export interface IJWTPayload {
  sub: string;
  exp?: number;
  iat?: number;
  app_metadata?: {
    tier?: string;
    custom_rate_limit?: {
      limit: number;
      window_seconds: number;
    };
  };
}

/**
 * エラー理由の型定義
 */
export type TokenErrorReason = 'expired' | 'not_yet_valid' | 'missing_exp';
export type AuthenticationErrorReason = TokenErrorReason | 'invalid_user_id';

/**
 * 認証成功の結果型
 */
export interface IAuthenticationSuccess {
  success: true;
  user: AuthenticatedUser;
}

/**
 * 認証失敗の結果型
 */
export interface IAuthenticationFailure {
  success: false;
  error: {
    type: 'INVALID_TOKEN' | 'INVALID_PAYLOAD';
    reason: AuthenticationErrorReason;
    message: string;
    details: Record<string, unknown>;
  };
}

/**
 * 認証結果の統合型
 */
export type AuthenticationResult = IAuthenticationSuccess | IAuthenticationFailure;

/**
 * レート制限チェックの結果型
 */
export interface IRateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  resetTime: Date;
  remainingSeconds: number;
  remainingRequests: number;
}

/**
 * レート制限の状態を表す型
 */
export interface IRateLimitState {
  requestCount: number;
  windowStartTime: Date;
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
 *
 * @deprecated 新規コードではAuthenticationServiceClassを使用してください。
 * このクラスは後方互換性のために保持されています。
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AuthenticationService {
  private static readonly instance = new AuthenticationServiceClass(console);

  /**
   * JWTペイロードから検証済みのAuthenticatedUserを作成する
   * @returns 成功時はAuthenticatedUser、失敗時はエラー情報を含むResult型
   */
  static createAuthenticatedUserFromJWT(payload: IJWTPayload): AuthenticationResult {
    return this.instance.createAuthenticatedUserFromJWT(payload);
  }

  /**
   * トークンの時刻関連の有効性を包括的に検証する
   * @returns 検証結果と理由
   */
  static validateTokenTiming(payload: IJWTPayload):
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
    return this.instance.validateTokenTiming(payload);
  }

  /**
   * レート制限を確認する（改善版）
   * @param user - 認証済みユーザー
   * @param rateLimitState - レート制限の現在の状態
   * @param currentTime - 現在時刻（テスト用にオプショナル）
   * @returns レート制限の確認結果
   */
  static checkRateLimit(
    user: AuthenticatedUser,
    rateLimitState: IRateLimitState | null,
    currentTime: Date = new Date(),
  ): IRateLimitCheckResult {
    return this.instance.checkRateLimit(user, rateLimitState, currentTime);
  }

  /**
   * レート制限エラー時のretry-after秒数を計算する
   * @param resetTime - レート制限がリセットされる時刻
   * @param currentTime - 現在時刻（テスト用にオプショナル）
   * @returns retry-after秒数（最小1秒）
   */
  static calculateRetryAfterSeconds(resetTime: Date, currentTime: Date = new Date()): number {
    return this.instance.calculateRetryAfterSeconds(resetTime, currentTime);
  }
}

// Re-export the class-based version for DI
export { AuthenticationServiceClass } from './AuthenticationService.class';
