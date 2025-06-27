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

  // 業界標準に準拠：getEventData()を廃止し、プロパティを直接公開
  // toJSON()メソッドが自動的に全てのpublicプロパティをシリアライズ
}
