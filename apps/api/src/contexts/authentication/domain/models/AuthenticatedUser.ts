import type { UserId } from '@nara-opendata/shared-kernel';
import type { RateLimit } from './RateLimit';
import { equalsRateLimit } from './RateLimit';

/**
 * 認証されたユーザーを表すバリューオブジェクト
 */
export class AuthenticatedUser {
  private constructor(
    private readonly _userId: UserId,
    private readonly _rateLimit: RateLimit,
  ) {}

  /**
   * ユーザーIDを取得する
   */
  get userId(): UserId {
    return this._userId;
  }

  /**
   * レート制限を取得する
   */
  get rateLimit(): RateLimit {
    return this._rateLimit;
  }

  /**
   * AuthenticatedUserを作成する
   */
  static create(userId: UserId, rateLimit: RateLimit): AuthenticatedUser {
    return new AuthenticatedUser(userId, rateLimit);
  }

  /**
   * 等価性を判定する
   */
  equals(other: AuthenticatedUser): boolean {
    return this._userId === other._userId && equalsRateLimit(this._rateLimit, other._rateLimit);
  }
}
