/**
 * ロガーインターフェース
 *
 * アプリケーション全体で使用される共通のロギング機能を定義します。
 * 実装はインフラストラクチャ層で提供されます。
 */
export interface ILogger {
  /**
   * デバッグレベルのログを出力する
   * @param message ログメッセージ
   * @param meta 追加のメタデータ
   */
  debug(message: string, meta?: Record<string, unknown>): void;

  /**
   * 情報レベルのログを出力する
   * @param message ログメッセージ
   * @param meta 追加のメタデータ
   */
  info(message: string, meta?: Record<string, unknown>): void;

  /**
   * 警告レベルのログを出力する
   * @param message ログメッセージ
   * @param meta 追加のメタデータ
   */
  warn(message: string, meta?: Record<string, unknown>): void;

  /**
   * エラーレベルのログを出力する
   * @param message ログメッセージ
   * @param error エラーオブジェクト
   * @param meta 追加のメタデータ
   */
  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void;
}
