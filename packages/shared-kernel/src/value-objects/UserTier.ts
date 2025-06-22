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
 * ブランド型を使用してTierLevel型と区別する
 */
export type UserTier = TierLevel & { readonly brand: unique symbol };

/**
 * レート制限の設定を表す型
 */
export interface IRateLimitConfig {
  limit: number;
  windowSeconds: number;
}

/**
 * UserTierを作成する
 */
export function createUserTier(level: TierLevel): UserTier {
  return level as UserTier;
}

/**
 * UserTierからTierLevelを取得する
 */
export function getUserTierLevel(tier: UserTier): TierLevel {
  return tier as TierLevel;
}

/**
 * UserTierのデフォルトレート制限を取得する
 */
export function getUserTierDefaultRateLimit(tier: UserTier): IRateLimitConfig {
  const rateLimits: Record<TierLevel, IRateLimitConfig> = {
    [TierLevel.TIER1]: { limit: 60, windowSeconds: 60 },
    [TierLevel.TIER2]: { limit: 120, windowSeconds: 60 },
    [TierLevel.TIER3]: { limit: 300, windowSeconds: 60 },
  };
  return rateLimits[tier as TierLevel];
}

/**
 * UserTierの等価性を比較する
 */
export function equalsUserTier(a: UserTier, b: UserTier): boolean {
  return a === b;
}

/**
 * UserTierを文字列に変換する
 */
export function userTierToString(tier: UserTier): string {
  return tier as string;
}
