import { type UserId, UserTier } from '@nara-opendata/shared-kernel'
import { RateLimit } from './RateLimit'

/**
 * 認証されたユーザーを表すバリューオブジェクト
 */
export class AuthenticatedUser {
  private constructor(
    private readonly _userId: UserId,
    private readonly _userTier: UserTier,
    private readonly _rateLimit: RateLimit,
    private readonly _customRateLimit: boolean = false
  ) {}

  /**
   * ユーザーIDを取得する
   */
  get userId(): UserId {
    return this._userId
  }

  /**
   * ユーザーティアを取得する
   */
  get userTier(): UserTier {
    return this._userTier
  }

  /**
   * レート制限を取得する
   */
  get rateLimit(): RateLimit {
    return this._rateLimit
  }

  /**
   * カスタムレート制限かどうかを取得する
   */
  get hasCustomRateLimit(): boolean {
    return this._customRateLimit
  }

  /**
   * デフォルトのレート制限でAuthenticatedUserを作成する
   */
  static create(userId: UserId, userTier: UserTier): AuthenticatedUser {
    const defaultLimit = userTier.defaultRateLimit
    const rateLimit = RateLimit.create(defaultLimit.limit, defaultLimit.windowSeconds)
    return new AuthenticatedUser(userId, userTier, rateLimit, false)
  }

  /**
   * カスタムレート制限でAuthenticatedUserを作成する
   */
  static createWithCustomRateLimit(
    userId: UserId,
    userTier: UserTier,
    rateLimit: RateLimit
  ): AuthenticatedUser {
    return new AuthenticatedUser(userId, userTier, rateLimit, true)
  }

  /**
   * 等価性を判定する
   */
  equals(other: AuthenticatedUser): boolean {
    return (
      this._userId === other._userId &&
      this._userTier.equals(other._userTier) &&
      this._rateLimit.equals(other._rateLimit) &&
      this._customRateLimit === other._customRateLimit
    )
  }

  /**
   * レート制限を変更した新しいインスタンスを作成する
   */
  withRateLimit(rateLimit: RateLimit): AuthenticatedUser {
    return new AuthenticatedUser(this._userId, this._userTier, rateLimit, true)
  }

  /**
   * ティアを変更した新しいインスタンスを作成する（レート制限もデフォルトに戻る）
   */
  withTier(userTier: UserTier): AuthenticatedUser {
    return AuthenticatedUser.create(this._userId, userTier)
  }
}