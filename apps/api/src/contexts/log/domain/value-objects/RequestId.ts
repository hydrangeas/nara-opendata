import { randomUUID } from 'crypto';

/**
 * リクエストID属性
 */
export interface IRequestIdAttributes {
  value: string;
}

/**
 * リクエストIDバリューオブジェクト
 * HTTPリクエストの一意識別子
 */
export type RequestId = IRequestIdAttributes & { readonly brand: unique symbol };

/**
 * 新しいリクエストIDを生成する
 */
export function generateRequestId(): RequestId {
  return { value: randomUUID().toLowerCase() } as RequestId;
}

/**
 * 既存の値からリクエストIDを作成する
 */
export function createRequestId(value: string): RequestId {
  if (!value || value.trim() === '') {
    throw new Error('RequestId cannot be empty');
  }
  return { value: value.trim() } as RequestId;
}

/**
 * リクエストIDの値を取得する
 */
export function getRequestIdValue(requestId: RequestId): string {
  return requestId.value;
}

/**
 * リクエストIDの等価性を判定する
 */
export function equalsRequestId(a: RequestId, b: RequestId): boolean {
  return a.value === b.value;
}

/**
 * リクエストIDのハッシュコードを取得する
 */
export function hashCodeRequestId(requestId: RequestId): number {
  let hash = 0;
  for (let i = 0; i < requestId.value.length; i++) {
    const char = requestId.value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
