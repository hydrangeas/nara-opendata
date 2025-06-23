import type { UserId } from '@nara-opendata/shared-kernel';
import type { LogId, Endpoint } from '../value-objects';
import { createLogId, equalsLogId, getEndpointPath } from '../value-objects';

/**
 * レート制限ログエンティティ
 * APIアクセスのレート制限チェック用のログ
 */
export interface IRateLimitLogAttributes {
  id: LogId;
  userId: UserId;
  endpoint: Endpoint;
  requestedAt: Date;
}

export class RateLimitLog implements IRateLimitLogAttributes {
  readonly id: LogId;
  readonly userId: UserId;
  readonly endpoint: Endpoint;
  readonly requestedAt: Date;

  constructor(attributes: { id?: LogId; userId: UserId; endpoint: Endpoint; requestedAt?: Date }) {
    this.id = attributes.id || createLogId();
    this.userId = attributes.userId;
    this.endpoint = attributes.endpoint;
    this.requestedAt = attributes.requestedAt || new Date();
  }

  /**
   * 新しいレート制限ログを作成する（ファクトリメソッド）
   */
  static create(params: { userId: UserId; endpoint: Endpoint }): RateLimitLog {
    return new RateLimitLog({
      userId: params.userId,
      endpoint: params.endpoint,
    });
  }

  /**
   * 永続化データから再構築する
   */
  static reconstruct(attributes: IRateLimitLogAttributes): RateLimitLog {
    return new RateLimitLog({
      id: attributes.id,
      userId: attributes.userId,
      endpoint: attributes.endpoint,
      requestedAt: attributes.requestedAt,
    });
  }

  /**
   * ログが指定された時間範囲内かチェックする
   */
  isWithinTimeRange(startTime: Date, endTime: Date): boolean {
    return this.requestedAt >= startTime && this.requestedAt <= endTime;
  }

  /**
   * ログが指定された秒数以内に記録されたかチェックする
   */
  isWithinSeconds(seconds: number, now = new Date()): boolean {
    const timeDiff = now.getTime() - this.requestedAt.getTime();
    return timeDiff <= seconds * 1000;
  }

  /**
   * エンティティの同一性を判定する
   */
  equals(other: RateLimitLog): boolean {
    return equalsLogId(this.id, other.id);
  }

  /**
   * デバッグ用の文字列表現
   */
  toString(): string {
    return `RateLimitLog(userId: ${this.userId}, endpoint: ${getEndpointPath(
      this.endpoint,
    )}, requestedAt: ${this.requestedAt.toISOString()})`;
  }

  /**
   * JSONシリアライズ用
   */
  toJSON(): IRateLimitLogAttributes {
    return {
      id: this.id,
      userId: this.userId,
      endpoint: this.endpoint,
      requestedAt: this.requestedAt,
    };
  }
}
