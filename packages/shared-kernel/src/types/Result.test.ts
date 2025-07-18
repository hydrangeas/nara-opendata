import { describe, expect, it } from 'vitest';
import { Result, success, failure, isSuccess, isFailure } from './Result';
import { createDomainError } from './DomainError';
import { ErrorType } from './ErrorType';

describe('Result', () => {
  describe('success', () => {
    it('成功のResultを作成できる', () => {
      const value = 'test value';
      const result = success(value);

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(value);
      } else {
        throw new Error('Expected success result');
      }
    });

    it('任意の型の値を格納できる', () => {
      const numberResult = success(42);
      const objectResult = success({ id: 1, name: 'test' });
      const arrayResult = success([1, 2, 3]);

      if (isSuccess(numberResult)) {
        expect(numberResult.value).toBe(42);
      }
      if (isSuccess(objectResult)) {
        expect(objectResult.value).toEqual({ id: 1, name: 'test' });
      }
      if (isSuccess(arrayResult)) {
        expect(arrayResult.value).toEqual([1, 2, 3]);
      }
    });
  });

  describe('failure', () => {
    it('失敗のResultを作成できる', () => {
      const error = createDomainError('TEST_ERROR', 'Test error', ErrorType.Business);
      const result = failure<string>(error);

      expect(result.success).toBe(false);
      if (isFailure(result)) {
        expect(result.error).toBe(error);
      } else {
        throw new Error('Expected failure result');
      }
    });

    it('異なるエラータイプで失敗を作成できる', () => {
      const validationError = createDomainError(
        'VALIDATION_ERROR',
        'Invalid input',
        ErrorType.Validation,
      );
      const notFoundError = createDomainError(
        'NOT_FOUND',
        'Resource not found',
        ErrorType.NotFound,
      );

      const result1 = failure<string>(validationError);
      const result2 = failure<number>(notFoundError);

      if (isFailure(result1)) {
        expect(result1.error.type).toBe(ErrorType.Validation);
      }
      if (isFailure(result2)) {
        expect(result2.error.type).toBe(ErrorType.NotFound);
      }
    });
  });

  describe('isSuccess', () => {
    it('成功の場合にtrueを返す', () => {
      const result = success('value');

      if (isSuccess(result)) {
        // TypeScriptの型推論が正しく動作することを確認
        expect(result.value).toBe('value');
      } else {
        throw new Error('Should be success');
      }
    });

    it('失敗の場合にfalseを返す', () => {
      const error = createDomainError('ERROR', 'Error', ErrorType.Business);
      const result = failure<string>(error);

      expect(isSuccess(result)).toBe(false);
    });
  });

  describe('isFailure', () => {
    it('失敗の場合にtrueを返す', () => {
      const error = createDomainError('ERROR', 'Error', ErrorType.Business);
      const result = failure<string>(error);

      if (isFailure(result)) {
        // TypeScriptの型推論が正しく動作することを確認
        expect(result.error).toBe(error);
      } else {
        throw new Error('Should be failure');
      }
    });

    it('成功の場合にfalseを返す', () => {
      const result = success('value');

      expect(isFailure(result)).toBe(false);
    });
  });

  describe('Result utility', () => {
    it('すべてのユーティリティ関数にアクセスできる', () => {
      expect(Result.success).toBe(success);
      expect(Result.failure).toBe(failure);
      expect(Result.isSuccess).toBe(isSuccess);
      expect(Result.isFailure).toBe(isFailure);
    });

    it('Result経由でsuccessを作成できる', () => {
      const result = Result.success('test');
      expect(isSuccess(result)).toBe(true);
    });

    it('Result経由でfailureを作成できる', () => {
      const error = createDomainError('ERROR', 'Error', ErrorType.Business);
      const result = Result.failure<string>(error);
      expect(isFailure(result)).toBe(true);
    });
  });
});
