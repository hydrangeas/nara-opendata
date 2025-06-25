import { DomainEvent } from './DomainEvent';

/**
 * ユーザーログアウトイベント
 */
export class UserLoggedOut extends DomainEvent {
  public readonly eventName = 'UserLoggedOut';

  constructor(
    public readonly userId: string,
    public readonly sessionDuration: number, // セッション時間（秒）
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    occurredAt?: Date,
  ) {
    super(occurredAt);
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userId,
      sessionDuration: this.sessionDuration,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }
}
