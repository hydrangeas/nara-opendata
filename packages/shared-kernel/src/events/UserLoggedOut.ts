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

  // 業界標準に準拠：getEventData()を廃止し、プロパティを直接公開
  // toJSON()メソッドが自動的に全てのpublicプロパティをシリアライズ
}
