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

  // 業界標準に準拠：getEventData()を廃止し、プロパティを直接公開
  // toJSON()メソッドが自動的に全てのpublicプロパティをシリアライズ
}
