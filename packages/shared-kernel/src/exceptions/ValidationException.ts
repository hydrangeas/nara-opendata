import { DomainException } from './DomainException';
import type { DomainError } from '../types/DomainError';
import { createDomainError } from '../types/DomainError';
import { ErrorType } from '../types/ErrorType';

/**
 * 検証例外
 */
export class ValidationException extends DomainException {
  readonly domainError: DomainError;

  constructor(
    message: string,
    public readonly validationErrors: readonly DomainError[],
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.domainError = createDomainError('VALIDATION_ERROR', message, ErrorType.Validation, {
      ...details,
      validationErrors: validationErrors.map((e) => ({
        code: e.code,
        message: e.message,
        details: e.details,
      })),
    });
  }
}
