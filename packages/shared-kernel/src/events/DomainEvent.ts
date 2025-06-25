import { randomUUID } from 'crypto';

/**
 * ドメインイベントの抽象基底クラス
 */
export abstract class DomainEvent {
  /**
   * イベントID（UUID）
   */
  public readonly eventId: string;

  /**
   * イベント発生日時
   */
  public readonly occurredAt: Date;

  /**
   * イベント名
   */
  public abstract readonly eventName: string;

  /**
   * イベントバージョン（将来の拡張用）
   */
  public readonly eventVersion: number = 1;

  protected constructor(occurredAt?: Date) {
    this.eventId = randomUUID();
    this.occurredAt = occurredAt || new Date();
  }

  /**
   * イベントデータを取得する
   */
  abstract getEventData(): Record<string, unknown>;

  /**
   * イベントをJSON形式で取得する
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      eventVersion: this.eventVersion,
      occurredAt: this.occurredAt.toISOString(),
      data: this.getEventData(),
    };
  }
}
