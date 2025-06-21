/**
 * レート制限を表すバリューオブジェクト
 */
export class RateLimit {
  private constructor(
    private readonly _limit: number,
    private readonly _windowSeconds: number,
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
   * RateLimitを作成する
   */
  static create(limit: number, windowSeconds: number): RateLimit {
    return new RateLimit(limit, windowSeconds);
  }

  /**
   * 等価性を判定する
   */
  equals(other: RateLimit): boolean {
    return this._limit === other._limit && this._windowSeconds === other._windowSeconds;
  }

  /**
   * 文字列表現を返す
   */
  toString(): string {
    return `${this._limit} requests per ${this._windowSeconds} seconds`;
  }
}
