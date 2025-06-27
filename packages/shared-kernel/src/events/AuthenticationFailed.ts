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

  // 業界標準に準拠：getEventData()を廃止し、プロパティを直接公開
  // toJSON()メソッドが自動的に全てのpublicプロパティをシリアライズ
}
