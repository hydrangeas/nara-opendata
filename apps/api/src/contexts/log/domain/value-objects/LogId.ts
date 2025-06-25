import { randomUUID } from 'crypto';

/**
 * ログID属性
 */
export interface ILogIdAttributes {
  value: string;
}

/**
 * ログIDバリューオブジェクト
 * ログエントリの一意識別子
 */
export type LogId = ILogIdAttributes & { readonly brand: unique symbol };

/**
 * 新しいログIDを生成する
 */
export function generateLogId(): LogId {
  return { value: randomUUID().toLowerCase() } as LogId;
}

/**
 * 既存の値からログIDを作成する
 */
export function createLogId(value: string): LogId {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    throw new Error('LogId cannot be empty');
  }
  return { value: trimmedValue } as LogId;
}

/**
 * ログIDの値を取得する
 */
export function getLogIdValue(logId: LogId): string {
  return logId.value;
}

/**
 * ログIDの等価性を判定する
 */
export function equalsLogId(a: LogId, b: LogId): boolean {
  return a.value === b.value;
}
