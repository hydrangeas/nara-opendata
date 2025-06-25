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
}
