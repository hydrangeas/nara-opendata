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
   * イベントをJSON形式で取得する
   * 業界標準に準拠：メタデータとイベント固有のプロパティを統合して返す
   */
  toJSON(): Record<string, unknown> {
    // デフォルト実装：全てのpublicプロパティをシリアライズ
    const eventData = Object.entries(this)
      .filter(([key]) => !key.startsWith('_')) // プライベートプロパティを除外
      .reduce(
        (acc, [key, value]) => {
          // Dateオブジェクトは ISO 文字列に変換
          if (value instanceof Date) {
            acc[key] = value.toISOString();
          } else if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );

    return eventData;
  }
}
