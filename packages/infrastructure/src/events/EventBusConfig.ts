/**
 * イベントバスの設定オプション
 */
export interface IEventBusConfig {
  /**
   * 最大ディスパッチサイクル数
   *
   * イベントハンドラー内で新しいイベントが発行される場合の無限ループを防ぐため、
   * 1回のpublish/publishAll呼び出しで実行される最大ディスパッチサイクル数を制限します。
   *
   * @default 10
   */
  maxDispatchCycles?: number;

  /**
   * 1サイクルあたりの最大イベント数
   *
   * メモリ使用量を制限するため、1つのディスパッチサイクルで処理される
   * 最大イベント数を制限します。
   *
   * @default 1000
   */
  maxEventsPerCycle?: number;

  /**
   * ハンドラー実行タイムアウト（ミリ秒）
   *
   * 個別のイベントハンドラーの実行時間を制限します。
   * タイムアウトした場合はエラーとして扱われます。
   *
   * @default 30000 (30秒)
   */
  handlerTimeoutMs?: number;

  /**
   * デバッグモード
   *
   * 有効にすると、詳細なデバッグログが出力されます。
   * 本番環境では無効にすることを推奨します。
   *
   * @default false
   */
  debugMode?: boolean;
}

/**
 * デフォルトのイベントバス設定
 */
export const defaultEventBusConfig: Required<IEventBusConfig> = {
  maxDispatchCycles: 10,
  maxEventsPerCycle: 1000,
  handlerTimeoutMs: 30000,
  debugMode: false,
};
