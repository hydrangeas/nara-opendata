/**
 * エラーの種別を表す列挙型
 */
export enum ErrorType {
  /** ビジネスルール違反 */
  Business = 'Business',
  /** 検証エラー */
  Validation = 'Validation',
  /** リソースが見つからない */
  NotFound = 'NotFound',
  /** 認証・認可エラー */
  Unauthorized = 'Unauthorized',
  /** レート制限エラー */
  RateLimit = 'RateLimit',
}
