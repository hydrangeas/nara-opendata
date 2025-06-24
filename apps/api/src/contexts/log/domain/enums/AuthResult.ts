/**
 * 認証結果
 * 認証操作の結果を表す
 */
export enum AuthResult {
  /**
   * 成功
   */
  SUCCESS = 'SUCCESS',

  /**
   * 失敗
   */
  FAILURE = 'FAILURE',

  /**
   * 期限切れ
   */
  EXPIRED = 'EXPIRED',
}

/**
 * 認証結果が成功かチェックする
 */
export function isSuccessfulAuthResult(result: AuthResult): boolean {
  return result === AuthResult.SUCCESS;
}
