import type { UserId } from '@nara-opendata/shared-kernel';
import type { APILogEntry } from '../entities';
import type { LogId, TimeRange, StatusCode } from '../value-objects';

/**
 * APIログリポジトリインターフェース
 */
export interface IAPILogRepository {
  /**
   * APIログを保存する
   */
  save(apiLog: APILogEntry): Promise<void>;

  /**
   * IDでAPIログを取得する
   */
  findById(id: LogId): Promise<APILogEntry | null>;

  /**
   * ユーザーIDでAPIログを取得する
   */
  findByUserId(userId: UserId, limit?: number): Promise<APILogEntry[]>;

  /**
   * 時間範囲でAPIログを取得する
   */
  findByTimeRange(timeRange: TimeRange): Promise<APILogEntry[]>;

  /**
   * ユーザーIDと時間範囲でAPIログを取得する
   */
  findByUserIdAndTimeRange(userId: UserId, timeRange: TimeRange): Promise<APILogEntry[]>;

  /**
   * パスでAPIログを取得する
   */
  findByPath(path: string, timeRange?: TimeRange): Promise<APILogEntry[]>;

  /**
   * ステータスコードでAPIログを取得する
   */
  findByStatusCode(statusCode: StatusCode, timeRange?: TimeRange): Promise<APILogEntry[]>;

  /**
   * エラーログを取得する（4xx, 5xx）
   */
  findErrors(timeRange: TimeRange): Promise<APILogEntry[]>;

  /**
   * ユーザーのAPIアクセス回数を取得する
   */
  countByUserId(userId: UserId, timeRange: TimeRange): Promise<number>;

  /**
   * パス別のアクセス統計を取得する
   */
  getPathStatistics(timeRange: TimeRange): Promise<Map<string, number>>;

  /**
   * ステータスコード別の統計を取得する
   */
  getStatusCodeStatistics(timeRange: TimeRange): Promise<Map<number, number>>;

  /**
   * レスポンスタイムの統計を取得する
   */
  getResponseTimeStatistics(timeRange: TimeRange): Promise<{
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  }>;

  /**
   * 遅いレスポンスのログを取得する
   */
  findSlowResponses(thresholdMs: number, timeRange: TimeRange): Promise<APILogEntry[]>;
}
