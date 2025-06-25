import type { UserId } from '@nara-opendata/shared-kernel';
import type { AuthLogEntry } from '../entities';
import type { LogId, TimeRange, AuthEvent, Provider, AuthResult } from '../value-objects';

/**
 * 認証ログリポジトリインターフェース
 */
export interface IAuthLogRepository {
  /**
   * 認証ログを保存する
   */
  save(authLog: AuthLogEntry): Promise<void>;

  /**
   * IDで認証ログを取得する
   */
  findById(id: LogId): Promise<AuthLogEntry | null>;

  /**
   * ユーザーIDで認証ログを取得する
   */
  findByUserId(userId: UserId, limit?: number): Promise<AuthLogEntry[]>;

  /**
   * 時間範囲で認証ログを取得する
   */
  findByTimeRange(timeRange: TimeRange): Promise<AuthLogEntry[]>;

  /**
   * ユーザーIDと時間範囲で認証ログを取得する
   */
  findByUserIdAndTimeRange(userId: UserId, timeRange: TimeRange): Promise<AuthLogEntry[]>;

  /**
   * イベントタイプで認証ログを取得する
   */
  findByEvent(event: AuthEvent, timeRange?: TimeRange): Promise<AuthLogEntry[]>;

  /**
   * プロバイダーで認証ログを取得する
   */
  findByProvider(provider: Provider, timeRange?: TimeRange): Promise<AuthLogEntry[]>;

  /**
   * 認証結果で認証ログを取得する
   */
  findByResult(result: AuthResult, timeRange?: TimeRange): Promise<AuthLogEntry[]>;

  /**
   * 失敗した認証の回数を取得する
   */
  countFailedByUserId(userId: UserId, timeRange: TimeRange): Promise<number>;

  /**
   * イベントタイプ別の統計を取得する
   */
  getEventStatistics(timeRange: TimeRange): Promise<Map<string, number>>;

  /**
   * プロバイダー別の統計を取得する
   */
  getProviderStatistics(timeRange: TimeRange): Promise<Map<string, number>>;
}
