import { describe, expect, it } from 'vitest';
import {
  ValidationResult,
  validationSuccess,
  validationFailure,
  combineValidationResults,
  isValidationSuccess,
  isValidationFailure,
} from './ValidationResult';
import { createDomainError } from './DomainError';
import { ErrorType } from './ErrorType';

describe('ValidationResult', () => {
  describe('validationSuccess', () => {
    it('成功のValidationResultを作成できる', () => {
      const result = validationSuccess();

      expect(result.isValid).toBe(true);
      expect('errors' in result).toBe(false);
    });
  });

  describe('validationFailure', () => {
    it('単一エラーで失敗のValidationResultを作成できる', () => {
      const error = createDomainError('VALIDATION_ERROR', 'Invalid value', ErrorType.Validation);
      const result = validationFailure([error]);

      expect(result.isValid).toBe(false);
      if (isValidationFailure(result)) {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toBe(error);
      }
    });

    it('複数エラーで失敗のValidationResultを作成できる', () => {
      const error1 = createDomainError('ERROR_1', 'First error', ErrorType.Validation);
      const error2 = createDomainError('ERROR_2', 'Second error', ErrorType.Validation);
      const result = validationFailure([error1, error2]);

      expect(result.isValid).toBe(false);
      if (isValidationFailure(result)) {
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain(error1);
        expect(result.errors).toContain(error2);
      }
    });

    it('エラー配列がイミュータブルである', () => {
      const error = createDomainError('ERROR', 'Error', ErrorType.Validation);
      const errors = [error];
      const result = validationFailure(errors);

      // 元の配列を変更してもresultには影響しない
      errors.push(createDomainError('NEW_ERROR', 'New error', ErrorType.Validation));

      if (isValidationFailure(result)) {
        expect(result.errors).toHaveLength(1);
        expect(() => {
          (result.errors as any).push(error);
        }).toThrow();
      }
    });

    it('空のエラー配列で作成しようとするとエラーになる', () => {
      expect(() => validationFailure([])).toThrow(
        'Validation failure must have at least one error',
      );
    });
  });

  describe('combineValidationResults', () => {
    it('すべて成功の場合は成功を返す', () => {
      const result1 = validationSuccess();
      const result2 = validationSuccess();
      const result3 = validationSuccess();

      const combined = combineValidationResults(result1, result2, result3);

      expect(combined.isValid).toBe(true);
      expect('errors' in combined).toBe(false);
    });

    it('一つでも失敗がある場合は失敗を返す', () => {
      const error = createDomainError('ERROR', 'Error', ErrorType.Validation);
      const result1 = validationSuccess();
      const result2 = validationFailure([error]);
      const result3 = validationSuccess();

      const combined = combineValidationResults(result1, result2, result3);

      expect(combined.isValid).toBe(false);
      if (isValidationFailure(combined)) {
        expect(combined.errors).toHaveLength(1);
        expect(combined.errors[0]).toBe(error);
      }
    });

    it('複数の失敗を結合できる', () => {
      const error1 = createDomainError('ERROR_1', 'Error 1', ErrorType.Validation);
      const error2 = createDomainError('ERROR_2', 'Error 2', ErrorType.Validation);
      const error3 = createDomainError('ERROR_3', 'Error 3', ErrorType.Validation);

      const result1 = validationFailure([error1]);
      const result2 = validationFailure([error2, error3]);

      const combined = combineValidationResults(result1, result2);

      expect(combined.isValid).toBe(false);
      if (isValidationFailure(combined)) {
        expect(combined.errors).toHaveLength(3);
        expect(combined.errors).toContain(error1);
        expect(combined.errors).toContain(error2);
        expect(combined.errors).toContain(error3);
      }
    });

    it('引数なしの場合は成功を返す', () => {
      const combined = combineValidationResults();

      expect(combined.isValid).toBe(true);
      expect('errors' in combined).toBe(false);
    });
  });

  describe('isValidationSuccess', () => {
    it('成功の場合にtrueを返す', () => {
      const result = validationSuccess();

      expect(isValidationSuccess(result)).toBe(true);
      expect(isValidationFailure(result)).toBe(false);
    });

    it('型ガードとして機能する', () => {
      const result = validationSuccess();

      if (isValidationSuccess(result)) {
        // TypeScriptがresultを成功型として認識
        expect(result.isValid).toBe(true);
        // @ts-expect-error - errorsプロパティは存在しない
        expect(result.errors).toBeUndefined();
      }
    });
  });

  describe('isValidationFailure', () => {
    it('失敗の場合にtrueを返す', () => {
      const error = createDomainError('ERROR', 'Error', ErrorType.Validation);
      const result = validationFailure([error]);

      expect(isValidationFailure(result)).toBe(true);
      expect(isValidationSuccess(result)).toBe(false);
    });

    it('型ガードとして機能する', () => {
      const error = createDomainError('ERROR', 'Error', ErrorType.Validation);
      const result = validationFailure([error]);

      if (isValidationFailure(result)) {
        // TypeScriptがresultを失敗型として認識
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors).toHaveLength(1);
      }
    });
  });

  describe('ValidationResult utility', () => {
    it('すべてのユーティリティ関数にアクセスできる', () => {
      expect(ValidationResult.success).toBe(validationSuccess);
      expect(ValidationResult.failure).toBe(validationFailure);
      expect(ValidationResult.combine).toBe(combineValidationResults);
      expect(ValidationResult.isSuccess).toBe(isValidationSuccess);
      expect(ValidationResult.isFailure).toBe(isValidationFailure);
    });

    it('ValidationResult経由でsuccessを作成できる', () => {
      const result = ValidationResult.success();
      expect(result.isValid).toBe(true);
    });

    it('ValidationResult経由でfailureを作成できる', () => {
      const error = createDomainError('ERROR', 'Error', ErrorType.Validation);
      const result = ValidationResult.failure([error]);
      expect(result.isValid).toBe(false);
    });

    it('ValidationResult経由でcombineできる', () => {
      const result1 = ValidationResult.success();
      const result2 = ValidationResult.failure([
        createDomainError('ERROR', 'Error', ErrorType.Validation),
      ]);

      const combined = ValidationResult.combine(result1, result2);
      expect(combined.isValid).toBe(false);
    });

    it('ValidationResult経由で型ガードが使える', () => {
      const success = ValidationResult.success();
      const failure = ValidationResult.failure([
        createDomainError('ERROR', 'Error', ErrorType.Validation),
      ]);

      expect(ValidationResult.isSuccess(success)).toBe(true);
      expect(ValidationResult.isFailure(failure)).toBe(true);
    });
  });
});
