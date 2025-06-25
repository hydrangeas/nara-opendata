import { DomainEvent } from './DomainEvent';

/**
 * 認証失敗イベント
 */
export class AuthenticationFailed extends DomainEvent {
  public readonly eventName = 'AuthenticationFailed';

  constructor(
    public readonly attemptedUserId: string | undefined,
    public readonly reason: string,
    public readonly provider: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    occurredAt?: Date,
  ) {
    super(occurredAt);
  }

  getEventData(): Record<string, unknown> {
    return {
      attemptedUserId: this.attemptedUserId,
      reason: this.reason,
      provider: this.provider,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }
}
