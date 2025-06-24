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
  if (!value || value.trim() === '') {
    throw new Error('LogId cannot be empty');
  }
  return { value } as LogId;
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

/**
 * ログIDのハッシュコードを取得する
 */
export function hashCodeLogId(logId: LogId): number {
  let hash = 0;
  for (let i = 0; i < logId.value.length; i++) {
    const char = logId.value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
