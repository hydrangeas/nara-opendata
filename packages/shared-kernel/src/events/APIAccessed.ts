import { DomainEvent } from './DomainEvent';

/**
 * APIアクセスイベント
 */
export class APIAccessed extends DomainEvent {
  public readonly eventName = 'APIAccessed';

  constructor(
    public readonly userId: string,
    public readonly endpoint: string,
    public readonly method: string,
    public readonly statusCode: number,
    public readonly responseTime: number, // ミリ秒
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    occurredAt?: Date,
  ) {
    super(occurredAt);
  }

  // 業界標準に準拠：getEventData()を廃止し、プロパティを直接公開
  // toJSON()メソッドが自動的に全てのpublicプロパティをシリアライズ
}
