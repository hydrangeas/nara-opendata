import { DomainException } from './DomainException';
import type { DomainError } from '../types/DomainError';
import { createDomainError } from '../types/DomainError';
import { ErrorType } from '../types/ErrorType';

/**
 * 認可例外
 */
export class AuthorizationException extends DomainException {
  readonly domainError: DomainError;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.domainError = createDomainError('AUTHZ_ERROR', message, ErrorType.Unauthorized, details);
  }
}
