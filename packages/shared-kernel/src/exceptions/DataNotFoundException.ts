import { DomainException } from './DomainException';
import type { DomainError } from '../types/DomainError';
import { createDomainError } from '../types/DomainError';
import { ErrorType } from '../types/ErrorType';

/**
 * データ未発見例外
 */
export class DataNotFoundException extends DomainException {
  readonly domainError: DomainError;

  constructor(
    message: string,
    public readonly resourceType?: string,
    public readonly resourceId?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.domainError = createDomainError('DATA_NOT_FOUND', message, ErrorType.NotFound, {
      ...details,
      resourceType,
      resourceId,
    });
  }
}
