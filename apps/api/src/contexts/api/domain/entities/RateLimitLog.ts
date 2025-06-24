import type { UserId } from '@nara-opendata/shared-kernel';
import type { LogId, Endpoint } from '../value-objects';
import { createLogId, equalsLogId, getEndpointPath } from '../value-objects';

/**
 * レート制限ログエンティティの属性
 */
export interface IRateLimitLogAttributes {
  id: LogId;
  userId: UserId;
  endpoint: Endpoint;
  requestedAt: Date;
}

/**
 * レート制限ログエンティティ
 * APIアクセスのレート制限チェック用のログ
 */
export type RateLimitLog = IRateLimitLogAttributes & { readonly brand: unique symbol };

/**
 * 新しいレート制限ログを作成する
 */
export function createRateLimitLog(params: { userId: UserId; endpoint: Endpoint }): RateLimitLog {
  return {
    id: createLogId(),
    userId: params.userId,
    endpoint: params.endpoint,
    requestedAt: new Date(),
  } as RateLimitLog;
}

/**
 * 永続化データから再構築する
 */
export function reconstructRateLimitLog(attributes: IRateLimitLogAttributes): RateLimitLog {
  return {
    id: attributes.id,
    userId: attributes.userId,
    endpoint: attributes.endpoint,
    requestedAt: attributes.requestedAt,
  } as RateLimitLog;
}

/**
 * レート制限ログのIDを取得する
 */
export function getRateLimitLogId(log: RateLimitLog): LogId {
  return log.id;
}

/**
 * レート制限ログのユーザーIDを取得する
 */
export function getRateLimitLogUserId(log: RateLimitLog): UserId {
  return log.userId;
}

/**
 * レート制限ログのエンドポイントを取得する
 */
export function getRateLimitLogEndpoint(log: RateLimitLog): Endpoint {
  return log.endpoint;
}

/**
 * レート制限ログのリクエスト日時を取得する
 */
export function getRateLimitLogRequestedAt(log: RateLimitLog): Date {
  return log.requestedAt;
}

/**
 * ログが指定された時間範囲内かチェックする
 */
export function isWithinTimeRange(log: RateLimitLog, startTime: Date, endTime: Date): boolean {
  return log.requestedAt >= startTime && log.requestedAt <= endTime;
}

/**
 * ログが指定された秒数以内に記録されたかチェックする
 */
export function isWithinSeconds(
  log: RateLimitLog,
  seconds: number,
  now: Date = new Date(),
): boolean {
  const timeDiff = now.getTime() - log.requestedAt.getTime();
  return timeDiff <= seconds * 1000;
}

/**
 * エンティティの同一性を判定する
 */
export function equalsRateLimitLog(a: RateLimitLog, b: RateLimitLog): boolean {
  return equalsLogId(a.id, b.id);
}

/**
 * デバッグ用の文字列表現
 */
export function rateLimitLogToString(log: RateLimitLog): string {
  return `RateLimitLog(userId: ${log.userId}, endpoint: ${getEndpointPath(
    log.endpoint,
  )}, requestedAt: ${log.requestedAt.toISOString()})`;
}
