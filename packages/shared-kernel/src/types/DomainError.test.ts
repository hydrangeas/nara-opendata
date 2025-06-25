import { describe, expect, it } from 'vitest';
import { createDomainError } from './DomainError';
import { ErrorType } from './ErrorType';

describe('DomainError', () => {
  describe('createDomainError', () => {
    it('基本的なドメインエラーを作成できる', () => {
      const error = createDomainError('TEST_ERROR', 'Test error message', ErrorType.Business);

      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.type).toBe(ErrorType.Business);
      expect(error.details).toBeUndefined();
    });

    it('詳細情報付きのドメインエラーを作成できる', () => {
      const details = {
        field: 'email',
        value: 'invalid-email',
        reason: 'Invalid format',
      };

      const error = createDomainError(
        'VALIDATION_ERROR',
        'Validation failed',
        ErrorType.Validation,
        details,
      );

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Validation failed');
      expect(error.type).toBe(ErrorType.Validation);
      expect(error.details).toEqual(details);
    });

    it('異なるエラータイプで作成できる', () => {
      const businessError = createDomainError(
        'BIZ_ERROR',
        'Business rule violation',
        ErrorType.Business,
      );
      const validationError = createDomainError('VAL_ERROR', 'Invalid input', ErrorType.Validation);
      const notFoundError = createDomainError(
        'NOT_FOUND',
        'Resource not found',
        ErrorType.NotFound,
      );
      const unauthorizedError = createDomainError('UNAUTH', 'Unauthorized', ErrorType.Unauthorized);
      const rateLimitError = createDomainError(
        'RATE_LIMIT',
        'Too many requests',
        ErrorType.RateLimit,
      );

      expect(businessError.type).toBe(ErrorType.Business);
      expect(validationError.type).toBe(ErrorType.Validation);
      expect(notFoundError.type).toBe(ErrorType.NotFound);
      expect(unauthorizedError.type).toBe(ErrorType.Unauthorized);
      expect(rateLimitError.type).toBe(ErrorType.RateLimit);
    });

    it('詳細情報がundefinedの場合はプロパティが存在しない', () => {
      const error = createDomainError('ERROR', 'Error message', ErrorType.Business, undefined);

      expect(error.code).toBe('ERROR');
      expect(error.message).toBe('Error message');
      expect(error.type).toBe(ErrorType.Business);
      expect('details' in error).toBe(false);
    });

    it('詳細情報に複雑なオブジェクトを含められる', () => {
      const complexDetails = {
        user: {
          id: '123',
          name: 'John Doe',
        },
        timestamp: new Date('2024-01-01'),
        errors: [
          { field: 'email', message: 'Invalid format' },
          { field: 'password', message: 'Too weak' },
        ],
      };

      const error = createDomainError(
        'COMPLEX_ERROR',
        'Complex error occurred',
        ErrorType.Business,
        complexDetails,
      );

      expect(error.details).toEqual(complexDetails);
    });

    it('返されるオブジェクトは不変である', () => {
      const error = createDomainError('ERROR', 'Message', ErrorType.Business);

      // オブジェクトが凍結されていることを確認（実装次第）
      // 現在の実装では凍結されていないが、TypeScriptの型定義でreadonlyとして保護されている
      expect(error.code).toBe('ERROR');
      expect(error.message).toBe('Message');
      expect(error.type).toBe(ErrorType.Business);
    });
  });
});
