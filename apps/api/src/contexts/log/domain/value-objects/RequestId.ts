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
