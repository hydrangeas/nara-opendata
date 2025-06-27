import { DomainEvent } from './DomainEvent';

/**
 * レート制限超過イベント
 */
export class RateLimitExceeded extends DomainEvent {
  public readonly eventName = 'RateLimitExceeded';

  constructor(
    public readonly userId: string,
    public readonly endpoint: string,
    public readonly limit: number,
    public readonly windowMinutes: number,
    public readonly requestCount: number,
    public readonly retryAfter: Date,
    public readonly ipAddress?: string,
    occurredAt?: Date,
  ) {
    super(occurredAt);
  }

  // 業界標準に準拠：getEventData()を廃止し、プロパティを直接公開
  // toJSON()メソッドが自動的に全てのpublicプロパティをシリアライズ
}
