import { describe, expect, it } from 'vitest';
import { ValidationException } from './ValidationException';
import { DomainException } from './DomainException';
import { ErrorType } from '../types/ErrorType';
import { createDomainError } from '../types/DomainError';

describe('ValidationException', () => {
  it('基本的な検証例外を作成できる', () => {
    const errors = [createDomainError('FIELD_REQUIRED', 'Name is required', ErrorType.Validation)];
    const exception = new ValidationException('Validation failed', errors);

    expect(exception.message).toBe('Validation failed');
    expect(exception.name).toBe('ValidationException');
    expect(exception.code).toBe('VALIDATION_ERROR');
    expect(exception.domainError.type).toBe(ErrorType.Validation);
    expect(exception.validationErrors).toEqual(errors);
  });

  it('複数のエラーを含む例外を作成できる', () => {
    const errors = [
      createDomainError('FIELD_REQUIRED', 'Email is required', ErrorType.Validation),
      createDomainError('INVALID_FORMAT', 'Phone number format is invalid', ErrorType.Validation),
      createDomainError('OUT_OF_RANGE', 'Age must be between 0 and 150', ErrorType.Validation),
    ];
    const exception = new ValidationException('Multiple validation errors', errors);

    expect(exception.validationErrors).toHaveLength(3);
    expect(exception.validationErrors).toEqual(errors);
  });

  it('詳細情報付きの例外を作成できる', () => {
    const errors = [
      createDomainError('INVALID_FORMAT', 'Invalid email format', ErrorType.Validation),
    ];
    const details = {
      form: 'user-registration',
      submittedAt: new Date().toISOString(),
    };

    const exception = new ValidationException('Form validation failed', errors, details);

    expect(exception.domainError.details).toMatchObject({
      ...details,
      validationErrors: [
        {
          code: 'INVALID_FORMAT',
          message: 'Invalid email format',
          details: undefined,
        },
      ],
    });
  });

  it('エラーの詳細情報を含む', () => {
    const errors = [
      createDomainError('FIELD_REQUIRED', 'Name is required', ErrorType.Validation, {
        field: 'name',
        value: null,
      }),
      createDomainError('INVALID_FORMAT', 'Invalid email', ErrorType.Validation, {
        field: 'email',
        value: 'not-an-email',
      }),
    ];
    const exception = new ValidationException('Validation failed', errors);

    const errorDetails = exception.domainError.details?.['validationErrors'] as any[];
    expect(errorDetails).toHaveLength(2);
    expect(errorDetails[0]).toEqual({
      code: 'FIELD_REQUIRED',
      message: 'Name is required',
      details: { field: 'name', value: null },
    });
    expect(errorDetails[1]).toEqual({
      code: 'INVALID_FORMAT',
      message: 'Invalid email',
      details: { field: 'email', value: 'not-an-email' },
    });
  });

  it('空のエラー配列でも作成できる', () => {
    const exception = new ValidationException('No errors', []);

    expect(exception.validationErrors).toEqual([]);
    expect(exception.domainError.details?.['validationErrors']).toEqual([]);
  });

  it('DomainExceptionを継承している', () => {
    const exception = new ValidationException('Test', []);

    expect(exception).toBeInstanceOf(ValidationException);
    expect(exception).toBeInstanceOf(DomainException);
    expect(exception).toBeInstanceOf(Error);
  });

  it('toJSONで構造化されたエラー情報を返す', () => {
    const errors = [
      createDomainError('REQUIRED', 'Field is required', ErrorType.Validation, {
        field: 'username',
      }),
    ];
    const exception = new ValidationException('Validation error', errors, {
      timestamp: '2024-01-01T12:00:00Z',
    });

    const json = exception.toJSON();

    expect(json).toEqual({
      name: 'ValidationException',
      code: 'VALIDATION_ERROR',
      message: 'Validation error',
      type: ErrorType.Validation,
      details: {
        timestamp: '2024-01-01T12:00:00Z',
        validationErrors: [
          {
            code: 'REQUIRED',
            message: 'Field is required',
            details: { field: 'username' },
          },
        ],
      },
    });
  });

  it('スタックトレースを持つ', () => {
    const exception = new ValidationException('Test error', []);

    expect(exception.stack).toBeDefined();
    expect(exception.stack).toContain('ValidationException');
  });
});
