import { DomainException } from './DomainException';
import type { DomainError } from '../types/DomainError';
import { createDomainError } from '../types/DomainError';
import { ErrorType } from '../types/ErrorType';

/**
 * レート制限例外
 */
export class RateLimitException extends DomainException {
  readonly domainError: DomainError;

  constructor(
    message: string,
    public readonly retryAfter?: Date,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.domainError = createDomainError('RATE_LIMIT_ERROR', message, ErrorType.RateLimit, {
      ...details,
      retryAfter: retryAfter?.toISOString(),
    });
  }

  /**
   * レート制限超過の例外を作成
   */
  static limitExceeded(
    limit: number,
    windowMinutes: number,
    retryAfter?: Date,
  ): RateLimitException {
    const message = `Rate limit exceeded. Limit: ${limit} requests per ${windowMinutes} minutes`;

    return new RateLimitException(message, retryAfter, {
      limit,
      windowMinutes,
    });
  }

  /**
   * リトライ可能時刻を秒数で取得
   */
  getRetryAfterSeconds(): number | undefined {
    if (!this.retryAfter) {
      return undefined;
    }

    const now = new Date();
    const diff = this.retryAfter.getTime() - now.getTime();

    return Math.max(0, Math.ceil(diff / 1000));
  }
}
