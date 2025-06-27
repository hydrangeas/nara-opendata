/**
 * イベントバスエラーの種類
 */
export enum EventBusErrorType {
  /** ディスパッチサイクルの上限に達した */
  MAX_CYCLES_EXCEEDED = 'MAX_CYCLES_EXCEEDED',
  /** サイクルあたりのイベント数上限に達した */
  MAX_EVENTS_EXCEEDED = 'MAX_EVENTS_EXCEEDED',
  /** ハンドラーの実行がタイムアウトした */
  HANDLER_TIMEOUT = 'HANDLER_TIMEOUT',
  /** ハンドラーの実行中にエラーが発生した */
  HANDLER_ERROR = 'HANDLER_ERROR',
}

/**
 * イベントバスのカスタムエラー
 */
export class EventBusError extends Error {
  constructor(
    public readonly type: EventBusErrorType,
    message: string,
    public readonly eventName?: string,
    public readonly eventId?: string,
    public override readonly cause?: Error | unknown,
  ) {
    super(message);
    this.name = 'EventBusError';

    // プロトタイプチェーンを正しく設定
    Object.setPrototypeOf(this, EventBusError.prototype);
  }

  /**
   * エラーの詳細情報を取得
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      eventName: this.eventName,
      eventId: this.eventId,
      cause:
        this.cause instanceof Error
          ? {
              name: this.cause.name,
              message: this.cause.message,
              stack: this.cause.stack,
            }
          : this.cause,
      stack: this.stack,
    };
  }
}
