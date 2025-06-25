import type { DomainError } from './DomainError';

/**
 * 成功または失敗を表す型
 * @template T 成功時の値の型
 */
export type Result<T> = { success: true; value: T } | { success: false; error: DomainError };

/**
 * 成功のResultを作成する
 */
export function success<T>(value: T): Result<T> {
  return { success: true, value };
}

/**
 * 失敗のResultを作成する
 */
export function failure<T>(error: DomainError): Result<T> {
  return { success: false, error };
}

/**
 * Resultが成功かどうかを判定する型ガード
 */
export function isSuccess<T>(result: Result<T>): result is { success: true; value: T } {
  return result.success === true;
}

/**
 * Resultが失敗かどうかを判定する型ガード
 */
export function isFailure<T>(result: Result<T>): result is { success: false; error: DomainError } {
  return result.success === false;
}

/**
 * Result型のユーティリティ関数
 */
export const Result = {
  success,
  failure,
  isSuccess,
  isFailure,
};
