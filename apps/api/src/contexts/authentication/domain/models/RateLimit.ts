import { TierLevel, TIER_DEFAULT_RATE_LIMITS } from '@nara-opendata/shared-kernel';

/**
 * レート制限の由来
 */
export enum RateLimitSource {
  TIER1_DEFAULT = 'TIER1_DEFAULT',
  TIER2_DEFAULT = 'TIER2_DEFAULT',
  TIER3_DEFAULT = 'TIER3_DEFAULT',
  CUSTOM = 'CUSTOM',
}

/**
 * レート制限の設定値
 */
export interface IRateLimitConfig {
  limit: number;
  windowSeconds: number;
  source: RateLimitSource;
}

/**
 * レート制限を表すバリューオブジェクト
 * ブランド型を使用してIRateLimitConfig型と区別する
 */
export type RateLimit = IRateLimitConfig & { readonly brand: unique symbol };

/**
 * レート制限を作成する
 */
function createRateLimit(config: IRateLimitConfig): RateLimit {
  // バリデーション
  if (config.limit <= 0) {
    throw new Error('Rate limit must be positive');
  }
  if (config.windowSeconds <= 0) {
    throw new Error('Window seconds must be positive');
  }
  if (!Number.isInteger(config.limit)) {
    throw new Error('Rate limit must be an integer');
  }
  if (!Number.isInteger(config.windowSeconds)) {
    throw new Error('Window seconds must be an integer');
  }

  return config as RateLimit;
}

/**
 * デフォルトのレート制限を作成する
 */
export function createDefaultRateLimit(tier: TierLevel): RateLimit {
  // shared-kernelで定義されたデフォルト値を使用
  const defaultConfig = TIER_DEFAULT_RATE_LIMITS[tier];

  // ティアに応じたRateLimitSourceを決定
  const sourceMap: Record<TierLevel, RateLimitSource> = {
    [TierLevel.TIER1]: RateLimitSource.TIER1_DEFAULT,
    [TierLevel.TIER2]: RateLimitSource.TIER2_DEFAULT,
    [TierLevel.TIER3]: RateLimitSource.TIER3_DEFAULT,
  };

  return createRateLimit({
    ...defaultConfig,
    source: sourceMap[tier],
  });
}

/**
 * カスタムレート制限を作成する
 */
export function createCustomRateLimit(limit: number, windowSeconds: number): RateLimit {
  return createRateLimit({
    limit,
    windowSeconds,
    source: RateLimitSource.CUSTOM,
  });
}

/**
 * レート制限の制限回数を取得する
 */
export function getRateLimitValue(rateLimit: RateLimit): number {
  return rateLimit.limit;
}

/**
 * レート制限のウィンドウ秒数を取得する
 */
export function getRateLimitWindowSeconds(rateLimit: RateLimit): number {
  return rateLimit.windowSeconds;
}

/**
 * レート制限の由来を取得する
 */
export function getRateLimitSource(rateLimit: RateLimit): RateLimitSource {
  return rateLimit.source;
}

/**
 * 1秒あたりのリクエスト数を計算する
 */
export function getRateLimitRequestsPerSecond(rateLimit: RateLimit): number {
  return rateLimit.limit / rateLimit.windowSeconds;
}

/**
 * カスタムレート制限かどうかを判定する
 */
export function isCustomRateLimit(rateLimit: RateLimit): boolean {
  return rateLimit.source === RateLimitSource.CUSTOM;
}

/**
 * レート制限の等価性を判定する
 */
export function equalsRateLimit(a: RateLimit, b: RateLimit): boolean {
  return a.limit === b.limit && a.windowSeconds === b.windowSeconds && a.source === b.source;
}

/**
 * レート制限の文字列表現を返す
 */
export function rateLimitToString(rateLimit: RateLimit): string {
  return `${rateLimit.limit} requests per ${rateLimit.windowSeconds} seconds`;
}
