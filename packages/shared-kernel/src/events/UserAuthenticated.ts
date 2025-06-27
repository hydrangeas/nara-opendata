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

  // 業界標準に準拠：getEventData()を廃止し、プロパティを直接公開
  // toJSON()メソッドが自動的に全てのpublicプロパティをシリアライズ
}
