import { DomainEvent } from './DomainEvent';

/**
 * ユーザー認証成功イベント
 */
export class UserAuthenticated extends DomainEvent {
  public readonly eventName = 'UserAuthenticated';

  constructor(
    public readonly userId: string,
    public readonly provider: string,
    public readonly userTier: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    occurredAt?: Date,
  ) {
    super(occurredAt);
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userId,
      provider: this.provider,
      userTier: this.userTier,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }
}
