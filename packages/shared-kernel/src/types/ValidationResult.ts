import type { DomainError } from './DomainError';

/**
 * バリデーション結果を表す型
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ValidationResult {
  /** バリデーションが成功したかどうか */
  readonly isValid: boolean;
  /** エラーのリスト（失敗時のみ） */
  readonly errors: readonly DomainError[];
}

/**
 * 成功のValidationResultを作成する
 */
export function validationSuccess(): ValidationResult {
  return {
    isValid: true,
    errors: [],
  };
}

/**
 * 失敗のValidationResultを作成する
 */
export function validationFailure(errors: DomainError[]): ValidationResult {
  return {
    isValid: false,
    errors: Object.freeze([...errors]),
  };
}

/**
 * 複数のValidationResultを結合する
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((result) => result.errors);

  if (allErrors.length === 0) {
    return validationSuccess();
  }

  return validationFailure(allErrors);
}

/**
 * ValidationResult型のユーティリティ関数
 */
export const ValidationResult = {
  success: validationSuccess,
  failure: validationFailure,
  combine: combineValidationResults,
} as const;
