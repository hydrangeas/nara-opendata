/**
 * ユーザーのティアレベルを表す列挙型
 */
export enum TierLevel {
  TIER1 = 'TIER1',
  TIER2 = 'TIER2',
  TIER3 = 'TIER3',
}

/**
 * ユーザーティアを表すバリューオブジェクト
 */
export class UserTier {
  private constructor(private readonly _level: TierLevel) {}

  /**
   * ティアレベルを取得する
   */
  get level(): TierLevel {
    return this._level;
  }

  /**
   * デフォルトレート制限を取得する
   */
  get defaultRateLimit(): { limit: number; windowSeconds: number } {
    const rateLimits = {
      [TierLevel.TIER1]: { limit: 60, windowSeconds: 60 },
      [TierLevel.TIER2]: { limit: 120, windowSeconds: 60 },
      [TierLevel.TIER3]: { limit: 300, windowSeconds: 60 },
    };
    return rateLimits[this._level];
  }

  /**
   * UserTierを作成する
   */
  static create(level: TierLevel): UserTier {
    return new UserTier(level);
  }

  /**
   * 文字列からUserTierを作成する
   */
  static fromString(value: string): UserTier {
    if (!Object.values(TierLevel).includes(value as TierLevel)) {
      throw new Error(`Invalid tier level: ${value}`);
    }
    return new UserTier(value as TierLevel);
  }

  /**
   * 等価性を判定する
   */
  equals(other: UserTier): boolean {
    return this._level === other._level;
  }

  /**
   * 文字列表現を返す
   */
  toString(): string {
    return this._level;
  }
}
