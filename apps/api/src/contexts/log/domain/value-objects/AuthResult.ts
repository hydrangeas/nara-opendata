/**
 * 認証結果の値
 */
export enum AuthResultValue {
  /**
   * 成功
   */
  SUCCESS = 'SUCCESS',

  /**
   * 失敗
   */
  FAILURE = 'FAILURE',
}

/**
 * 認証結果属性
 */
export interface IAuthResultAttributes {
  value: AuthResultValue;
}

/**
 * 認証結果バリューオブジェクト
 * 認証の成功/失敗を表現
 */
export type AuthResult = IAuthResultAttributes & { readonly brand: unique symbol };

/**
 * 認証結果を作成する
 */
export function createAuthResult(value: AuthResultValue): AuthResult {
  return { value } as AuthResult;
}

/**
 * 認証結果の値を取得する
 */
export function getAuthResultValue(authResult: AuthResult): AuthResultValue {
  return authResult.value;
}

/**
 * 認証結果の等価性を判定する
 */
export function equalsAuthResult(a: AuthResult, b: AuthResult): boolean {
  return a.value === b.value;
}

/**
 * 認証が成功したかチェックする
 */
export function isSuccessfulAuthResult(authResult: AuthResult): boolean {
  return authResult.value === AuthResultValue.SUCCESS;
}

/**
 * 成功の認証結果を作成する（便利関数）
 */
export function createSuccessAuthResult(): AuthResult {
  return createAuthResult(AuthResultValue.SUCCESS);
}

/**
 * 失敗の認証結果を作成する（便利関数）
 */
export function createFailureAuthResult(): AuthResult {
  return createAuthResult(AuthResultValue.FAILURE);
}
