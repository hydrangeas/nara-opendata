import type { UserId } from '@nara-opendata/shared-kernel';
import type { TimeRange, StatsCriteria } from '../value-objects';
import type { LogAnalysisServiceClass } from './LogAnalysisService.class';
import type { IAuthLogStats, IAPILogStats, IUserActivityStats } from './LogAnalysisService.class';

// Re-export types from class version
export type { IAuthLogStats, IAPILogStats, IUserActivityStats } from './LogAnalysisService.class';

/**
 * ログ分析ドメインサービス
 * 認証ログとAPIログの統合的な分析機能を提供
 *
 * @deprecated 新規コードではLogAnalysisServiceClassを使用してください。
 * このクラスは後方互換性のために保持されています。
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class LogAnalysisService {
  private static instance: LogAnalysisServiceClass | null = null;

  /**
   * インスタンスを設定する（初期化用）
   */
  static setInstance(instance: LogAnalysisServiceClass): void {
    this.instance = instance;
  }

  /**
   * 認証ログの統計を取得する
   */
  static async getAuthLogStats(criteria: StatsCriteria): Promise<IAuthLogStats> {
    if (!this.instance) {
      throw new Error('LogAnalysisService instance not initialized');
    }
    return this.instance.getAuthLogStats(criteria);
  }

  /**
   * APIログの統計を取得する
   */
  static async getAPILogStats(criteria: StatsCriteria): Promise<IAPILogStats> {
    if (!this.instance) {
      throw new Error('LogAnalysisService instance not initialized');
    }
    return this.instance.getAPILogStats(criteria);
  }

  /**
   * ユーザーアクティビティの統計を取得する
   */
  static async getUserActivityStats(
    userId: UserId,
    timeRange: TimeRange,
  ): Promise<IUserActivityStats> {
    if (!this.instance) {
      throw new Error('LogAnalysisService instance not initialized');
    }
    return this.instance.getUserActivityStats(userId, timeRange);
  }

  /**
   * 疑わしいアクティビティを検出する
   */
  static async detectSuspiciousActivity(
    timeRange: TimeRange,
    thresholds: {
      maxFailedAuth: number;
      maxErrorRate: number;
    },
  ): Promise<UserId[]> {
    if (!this.instance) {
      throw new Error('LogAnalysisService instance not initialized');
    }
    return this.instance.detectSuspiciousActivity(timeRange, thresholds);
  }

  /**
   * システム全体のヘルススコアを計算する
   */
  static async calculateSystemHealthScore(timeRange: TimeRange): Promise<number> {
    if (!this.instance) {
      throw new Error('LogAnalysisService instance not initialized');
    }
    return this.instance.calculateSystemHealthScore(timeRange);
  }
}

// Re-export the class-based version for DI
export { LogAnalysisServiceClass } from './LogAnalysisService.class';
