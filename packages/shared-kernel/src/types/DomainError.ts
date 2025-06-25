import type { ErrorType } from './ErrorType';

/**
 * ドメインエラーを表すインターフェース
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface DomainError {
  /** エラーコード（一意の識別子） */
  readonly code: string;
  /** エラーメッセージ */
  readonly message: string;
  /** エラータイプ */
  readonly type: ErrorType;
  /** 追加の詳細情報 */
  readonly details?: Record<string, unknown>;
}

/**
 * ドメインエラーを作成するファクトリ関数
 */
export function createDomainError(
  code: string,
  message: string,
  type: ErrorType,
  details?: Record<string, unknown>,
): DomainError {
  if (details !== undefined) {
    return {
      code,
      message,
      type,
      details,
    };
  }

  return {
    code,
    message,
    type,
  };
}
