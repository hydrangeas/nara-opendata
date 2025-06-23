import { randomUUID } from 'crypto';

/**
 * ログIDを表すバリューオブジェクト
 * UUIDv4形式の一意な識別子
 */
export interface ILogIdAttributes {
  value: string;
}

export type LogId = ILogIdAttributes & { readonly brand: unique symbol };

/**
 * ログIDを作成する
 */
export function createLogId(value?: string): LogId {
  if (value !== undefined) {
    // 空文字列チェック
    if (value === '') {
      throw new Error('LogId cannot be empty');
    }

    // 既存のUUIDを使用する場合の検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error('Invalid UUID format');
    }
    return { value: value.toLowerCase() } as LogId;
  }

  // 新規生成（小文字に正規化）
  return { value: randomUUID().toLowerCase() } as LogId;
}

/**
 * LogIdから文字列値を取得する
 */
export function getLogIdValue(logId: LogId): string {
  return logId.value;
}

/**
 * LogIdの等価性を判定する
 */
export function equalsLogId(a: LogId, b: LogId): boolean {
  return a.value === b.value;
}
