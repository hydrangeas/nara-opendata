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

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userId,
      endpoint: this.endpoint,
      limit: this.limit,
      windowMinutes: this.windowMinutes,
      requestCount: this.requestCount,
      retryAfter: this.retryAfter.toISOString(),
      ipAddress: this.ipAddress,
    };
  }
}
