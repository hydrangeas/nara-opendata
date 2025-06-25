import { DomainException } from './DomainException';
import type { DomainError } from '../types/DomainError';
import { createDomainError } from '../types/DomainError';
import { ErrorType } from '../types/ErrorType';
import type { ValidationResult } from '../types/ValidationResult';

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

  /**
   * 単一フィールドの検証例外を作成
   */
  static invalidField(fieldName: string, value: unknown, reason: string): ValidationException {
    const error = createDomainError(
      `INVALID_${fieldName.toUpperCase()}`,
      `${fieldName}: ${reason}`,
      ErrorType.Validation,
      { fieldName, value },
    );

    return new ValidationException(`Validation failed for field '${fieldName}'`, [error], {
      fieldName,
      value,
    });
  }

  /**
   * 複数フィールドの検証例外を作成
   */
  static multipleErrors(errors: DomainError[]): ValidationException {
    const errorCount = errors.length;
    const message =
      errorCount === 1
        ? 'Validation failed with 1 error'
        : `Validation failed with ${errorCount} errors`;

    return new ValidationException(message, errors);
  }

  /**
   * ValidationResultから例外を作成
   */
  static fromValidationResult(result: ValidationResult): ValidationException {
    if (result.isValid) {
      throw new Error('Cannot create ValidationException from valid result');
    }

    return ValidationException.multipleErrors([...result.errors]);
  }

  /**
   * 必須フィールドエラーの例外を作成
   */
  static requiredField(fieldName: string): ValidationException {
    return ValidationException.invalidField(fieldName, undefined, 'is required');
  }

  /**
   * 無効な形式エラーの例外を作成
   */
  static invalidFormat(
    fieldName: string,
    value: unknown,
    expectedFormat: string,
  ): ValidationException {
    return ValidationException.invalidField(
      fieldName,
      value,
      `must match format: ${expectedFormat}`,
    );
  }
}
