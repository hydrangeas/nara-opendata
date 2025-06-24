/**
 * レート制限超過時の例外
 */
export class RateLimitException extends Error {
  /**
   * 次にリクエスト可能になるまでの秒数
   */
  readonly retryAfterSeconds: number;

  /**
   * 現在のレート制限値
   */
  readonly limit: number;

  /**
   * レート制限のウィンドウ秒数
   */
  readonly windowSeconds: number;

  constructor(params: {
    message?: string;
    retryAfterSeconds: number;
    limit: number;
    windowSeconds: number;
  }) {
    super(
      params.message ||
        `Rate limit exceeded. Limit: ${params.limit} requests per ${params.windowSeconds} seconds. Retry after ${params.retryAfterSeconds} seconds.`,
    );
    this.name = 'RateLimitException';
    this.retryAfterSeconds = params.retryAfterSeconds;
    this.limit = params.limit;
    this.windowSeconds = params.windowSeconds;

    // プロトタイプチェーンの修正（TypeScriptでのError継承の問題を回避）
    Object.setPrototypeOf(this, RateLimitException.prototype);
  }
}
