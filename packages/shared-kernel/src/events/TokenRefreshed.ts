import { DomainEvent } from './DomainEvent';

/**
 * トークンリフレッシュイベント
 */
export class TokenRefreshed extends DomainEvent {
  public readonly eventName = 'TokenRefreshed';

  constructor(
    public readonly userId: string,
    public readonly oldTokenId: string,
    public readonly newTokenId: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    occurredAt?: Date,
  ) {
    super(occurredAt);
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userId,
      oldTokenId: this.oldTokenId,
      newTokenId: this.newTokenId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }
}
