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

  /**
   * リソースが見つからない例外を作成
   */
  static resourceNotFound(resourceType: string, resourceId: string): DataNotFoundException {
    return new DataNotFoundException(
      `${resourceType} with ID '${resourceId}' not found`,
      resourceType,
      resourceId,
    );
  }

  /**
   * ファイルが見つからない例外を作成
   */
  static fileNotFound(filePath: string): DataNotFoundException {
    return new DataNotFoundException(`File not found: ${filePath}`, 'File', filePath, { filePath });
  }

  /**
   * エンティティが見つからない例外を作成
   */
  static entityNotFound(
    entityName: string,
    criteria: Record<string, unknown>,
  ): DataNotFoundException {
    const criteriaStr = Object.entries(criteria)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');

    return new DataNotFoundException(
      `${entityName} not found with criteria: ${criteriaStr}`,
      entityName,
      undefined,
      { criteria },
    );
  }
}
