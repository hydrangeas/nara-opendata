import type { DomainError } from './DomainError';

/**
 * バリデーション結果を表す判別共用体型
 */
export type ValidationResult =
  | { readonly isValid: true }
  | { readonly isValid: false; readonly errors: readonly DomainError[] };

/**
 * 成功のValidationResultを作成する
 */
export function validationSuccess(): ValidationResult {
  return { isValid: true };
}

/**
 * 失敗のValidationResultを作成する
 */
export function validationFailure(errors: DomainError[]): ValidationResult {
  if (errors.length === 0) {
    throw new Error('Validation failure must have at least one error');
  }
  return {
    isValid: false,
    errors: Object.freeze([...errors]),
  };
}

/**
 * ValidationResultが成功かどうかを判定する型ガード
 */
export function isValidationSuccess(result: ValidationResult): result is { isValid: true } {
  return result.isValid === true;
}

/**
 * ValidationResultが失敗かどうかを判定する型ガード
 */
export function isValidationFailure(
  result: ValidationResult,
): result is { isValid: false; errors: readonly DomainError[] } {
  return result.isValid === false;
}

/**
 * 複数のValidationResultを結合する
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const failures = results.filter(isValidationFailure);

  if (failures.length === 0) {
    return validationSuccess();
  }

  const allErrors = failures.flatMap((f) => f.errors);
  return validationFailure(allErrors);
}

/**
 * ValidationResult型のユーティリティ関数
 */
export const ValidationResult = {
  success: validationSuccess,
  failure: validationFailure,
  combine: combineValidationResults,
  isSuccess: isValidationSuccess,
  isFailure: isValidationFailure,
} as const;
