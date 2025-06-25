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

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userId,
      endpoint: this.endpoint,
      method: this.method,
      statusCode: this.statusCode,
      responseTime: this.responseTime,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }
}
