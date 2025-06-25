import { DomainEvent } from './DomainEvent';

/**
 * データ取得成功イベント
 */
export class DataRetrieved extends DomainEvent {
  public readonly eventName = 'DataRetrieved';

  constructor(
    public readonly userId: string,
    public readonly resourcePath: string,
    public readonly fileSize: number, // バイト
    public readonly contentType: string,
    public readonly responseTime: number, // ミリ秒
    public readonly ipAddress?: string,
    occurredAt?: Date,
  ) {
    super(occurredAt);
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userId,
      resourcePath: this.resourcePath,
      fileSize: this.fileSize,
      contentType: this.contentType,
      responseTime: this.responseTime,
      ipAddress: this.ipAddress,
    };
  }
}
