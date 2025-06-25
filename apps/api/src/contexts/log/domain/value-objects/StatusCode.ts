/**
 * ステータスコード属性
 */
export interface IStatusCodeAttributes {
  code: number;
}

/**
 * ステータスコードバリューオブジェクト
 * HTTPステータスコードを表現
 */
export type StatusCode = IStatusCodeAttributes & { readonly brand: unique symbol };

/**
 * ステータスコードを作成する
 */
export function createStatusCode(code: number): StatusCode {
  if (!Number.isInteger(code) || code < 100 || code > 599) {
    throw new Error(`Invalid status code: ${code}. Must be between 100 and 599`);
  }
  return { code } as StatusCode;
}

/**
 * ステータスコードの値を取得する
 */
export function getStatusCodeValue(statusCode: StatusCode): number {
  return statusCode.code;
}

/**
 * ステータスコードの等価性を判定する
 */
export function equalsStatusCode(a: StatusCode, b: StatusCode): boolean {
  return a.code === b.code;
}

/**
 * ステータスコードが成功（2xx）かチェックする
 */
export function isSuccessStatusCode(statusCode: StatusCode): boolean {
  return statusCode.code >= 200 && statusCode.code < 300;
}

/**
 * ステータスコードがリダイレクト（3xx）かチェックする
 */
export function isRedirectStatusCode(statusCode: StatusCode): boolean {
  return statusCode.code >= 300 && statusCode.code < 400;
}

/**
 * ステータスコードがクライアントエラー（4xx）かチェックする
 */
export function isClientErrorStatusCode(statusCode: StatusCode): boolean {
  return statusCode.code >= 400 && statusCode.code < 500;
}

/**
 * ステータスコードがサーバーエラー（5xx）かチェックする
 */
export function isServerErrorStatusCode(statusCode: StatusCode): boolean {
  return statusCode.code >= 500 && statusCode.code < 600;
}

/**
 * ステータスコードがエラー（4xx または 5xx）かチェックする
 */
export function isErrorStatusCode(statusCode: StatusCode): boolean {
  return isClientErrorStatusCode(statusCode) || isServerErrorStatusCode(statusCode);
}
