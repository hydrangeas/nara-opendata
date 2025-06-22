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
 * レート制限を表すバリューオブジェクト
 */
export class RateLimit {
  private constructor(
    private readonly _limit: number,
    private readonly _windowSeconds: number,
    private readonly _source: RateLimitSource,
  ) {
    this.validate();
  }

  /**
   * 制限回数を取得する
   */
  get limit(): number {
    return this._limit;
  }

  /**
   * ウィンドウ秒数を取得する
   */
  get windowSeconds(): number {
    return this._windowSeconds;
  }

  /**
   * 1秒あたりのリクエスト数を計算する
   */
  get requestsPerSecond(): number {
    return this._limit / this._windowSeconds;
  }

  /**
   * レート制限の由来を取得する
   */
  get source(): RateLimitSource {
    return this._source;
  }

  /**
   * カスタムレート制限かどうかを判定する
   */
  get isCustom(): boolean {
    return this._source === RateLimitSource.CUSTOM;
  }

  /**
   * バリデーション
   */
  private validate(): void {
    if (this._limit <= 0) {
      throw new Error('Rate limit must be positive');
    }
    if (this._windowSeconds <= 0) {
      throw new Error('Window seconds must be positive');
    }
    if (!Number.isInteger(this._limit)) {
      throw new Error('Rate limit must be an integer');
    }
    if (!Number.isInteger(this._windowSeconds)) {
      throw new Error('Window seconds must be an integer');
    }
  }

  /**
   * デフォルトのレート制限を作成する
   */
  static createDefault(tier: string): RateLimit {
    const configs: Record<
      string,
      { limit: number; windowSeconds: number; source: RateLimitSource }
    > = {
      TIER1: { limit: 60, windowSeconds: 60, source: RateLimitSource.TIER1_DEFAULT },
      TIER2: { limit: 120, windowSeconds: 60, source: RateLimitSource.TIER2_DEFAULT },
      TIER3: { limit: 300, windowSeconds: 60, source: RateLimitSource.TIER3_DEFAULT },
    };

    const config = configs[tier];
    if (!config) {
      throw new Error(`Invalid tier level: ${tier}`);
    }

    return new RateLimit(config.limit, config.windowSeconds, config.source);
  }

  /**
   * カスタムレート制限を作成する
   */
  static createCustom(limit: number, windowSeconds: number): RateLimit {
    return new RateLimit(limit, windowSeconds, RateLimitSource.CUSTOM);
  }

  /**
   * 等価性を判定する
   */
  equals(other: RateLimit): boolean {
    return (
      this._limit === other._limit &&
      this._windowSeconds === other._windowSeconds &&
      this._source === other._source
    );
  }

  /**
   * 文字列表現を返す
   */
  toString(): string {
    return `${this._limit} requests per ${this._windowSeconds} seconds`;
  }
}
