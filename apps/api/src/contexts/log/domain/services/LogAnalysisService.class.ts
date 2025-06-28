import { injectable, inject } from 'tsyringe';
import type { UserId } from '@nara-opendata/shared-kernel';
import type { IAuthLogRepository, IAPILogRepository } from '../repositories';
import type { TimeRange, StatsCriteria } from '../value-objects';
import { AuthResultValue, createAuthResult } from '../value-objects';
import { TYPES } from '../../../../types/di';

/**
 * ログ分析結果の型定義
 */
export interface IAuthLogStats {
  totalEvents: number;
  successfulAuth: number;
  failedAuth: number;
  eventBreakdown: Map<string, number>;
  providerBreakdown: Map<string, number>;
  failureRate: number;
}

export interface IAPILogStats {
  totalRequests: number;
  uniqueUsers: number;
  errorCount: number;
  errorRate: number;
  pathBreakdown: Map<string, number>;
  statusCodeBreakdown: Map<number, number>;
  responseTimeStats: {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface IUserActivityStats {
  userId: UserId;
  authEvents: number;
  apiRequests: number;
  failedAuthAttempts: number;
  errorRequests: number;
  avgResponseTime: number;
  lastActivityAt: Date | null;
}

/**
 * ログ分析ドメインサービス（クラス版）
 * 認証ログとAPIログの統合的な分析機能を提供
 *
 * @remarks
 * DIコンテナで使用するためにクラスとして実装
 * 元のクラス版と同じインターフェースを提供
 */
@injectable()
export class LogAnalysisServiceClass {
  constructor(
    @inject(TYPES.IAuthLogRepository) private readonly authLogRepository: IAuthLogRepository,
    @inject(TYPES.IAPILogRepository) private readonly apiLogRepository: IAPILogRepository,
  ) {}

  /**
   * 認証ログの統計を取得する
   */
  async getAuthLogStats(criteria: StatsCriteria): Promise<IAuthLogStats> {
    const timeRange = criteria.timeRange;

    // 並列でデータを取得
    const [allLogs, successCount, failureCount, eventStats, providerStats] = await Promise.all([
      this.authLogRepository.findByTimeRange(timeRange),
      this.authLogRepository.findByResult(createAuthResult(AuthResultValue.SUCCESS), timeRange),
      this.authLogRepository.findByResult(createAuthResult(AuthResultValue.FAILURE), timeRange),
      this.authLogRepository.getEventStatistics(timeRange),
      this.authLogRepository.getProviderStatistics(timeRange),
    ]);

    const totalEvents = allLogs.length;
    const failureRate = totalEvents > 0 ? failureCount.length / totalEvents : 0;

    return {
      totalEvents,
      successfulAuth: successCount.length,
      failedAuth: failureCount.length,
      eventBreakdown: eventStats,
      providerBreakdown: providerStats,
      failureRate,
    };
  }

  /**
   * APIログの統計を取得する
   */
  async getAPILogStats(criteria: StatsCriteria): Promise<IAPILogStats> {
    const timeRange = criteria.timeRange;

    // 並列でデータを取得
    const [allLogs, errorLogs, pathStats, statusCodeStats, responseTimeStats] = await Promise.all([
      this.apiLogRepository.findByTimeRange(timeRange),
      this.apiLogRepository.findErrors(timeRange),
      this.apiLogRepository.getPathStatistics(timeRange),
      this.apiLogRepository.getStatusCodeStatistics(timeRange),
      this.apiLogRepository.getResponseTimeStatistics(timeRange),
    ]);

    const totalRequests = allLogs.length;
    const uniqueUsers = new Set(allLogs.map((log) => log.userId)).size;
    const errorCount = errorLogs.length;
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

    return {
      totalRequests,
      uniqueUsers,
      errorCount,
      errorRate,
      pathBreakdown: pathStats,
      statusCodeBreakdown: statusCodeStats,
      responseTimeStats,
    };
  }

  /**
   * ユーザーアクティビティの統計を取得する
   */
  async getUserActivityStats(userId: UserId, timeRange: TimeRange): Promise<IUserActivityStats> {
    // 並列でデータを取得
    const [authLogs, apiLogs, failedAuthCount] = await Promise.all([
      this.authLogRepository.findByUserIdAndTimeRange(userId, timeRange),
      this.apiLogRepository.findByUserIdAndTimeRange(userId, timeRange),
      this.authLogRepository.countFailedByUserId(userId, timeRange),
    ]);

    // エラーリクエスト数を計算
    const errorRequests = apiLogs.filter((log) => log.statusCode.code >= 400).length;

    // 平均レスポンスタイムを計算
    const avgResponseTime =
      apiLogs.length > 0
        ? apiLogs.reduce((sum, log) => sum + log.responseTime.milliseconds, 0) / apiLogs.length
        : 0;

    // 最終アクティビティ時刻を取得
    const allTimestamps = [
      ...authLogs.map((log) => log.timestamp),
      ...apiLogs.map((log) => log.timestamp),
    ];
    const lastActivityAt =
      allTimestamps.length > 0
        ? new Date(Math.max(...allTimestamps.map((d) => d.getTime())))
        : null;

    return {
      userId,
      authEvents: authLogs.length,
      apiRequests: apiLogs.length,
      failedAuthAttempts: failedAuthCount,
      errorRequests,
      avgResponseTime,
      lastActivityAt,
    };
  }

  /**
   * 疑わしいアクティビティを検出する
   */
  async detectSuspiciousActivity(
    timeRange: TimeRange,
    thresholds: {
      maxFailedAuth: number;
      maxErrorRate: number;
    },
  ): Promise<UserId[]> {
    const authLogs = await this.authLogRepository.findByTimeRange(timeRange);
    const apiLogs = await this.apiLogRepository.findByTimeRange(timeRange);

    // ユーザーごとの統計を集計
    const userStats = new Map<
      string,
      {
        failedAuth: number;
        totalRequests: number;
        errorRequests: number;
      }
    >();

    // 認証ログから失敗を集計
    for (const log of authLogs) {
      const userIdStr = log.userId as string;
      if (!userStats.has(userIdStr)) {
        userStats.set(userIdStr, { failedAuth: 0, totalRequests: 0, errorRequests: 0 });
      }
      if (log.result.value === AuthResultValue.FAILURE) {
        const stats = userStats.get(userIdStr);
        if (stats) {
          stats.failedAuth++;
        }
      }
    }

    // APIログからエラーを集計
    for (const log of apiLogs) {
      const userIdStr = log.userId as string;
      if (!userStats.has(userIdStr)) {
        userStats.set(userIdStr, { failedAuth: 0, totalRequests: 0, errorRequests: 0 });
      }
      const stats = userStats.get(userIdStr);
      if (stats) {
        stats.totalRequests++;
        if (log.statusCode.code >= 400) {
          stats.errorRequests++;
        }
      }
    }

    // 疑わしいユーザーを検出
    const suspiciousUsers: UserId[] = [];
    for (const [userIdStr, stats] of userStats) {
      const errorRate = stats.totalRequests > 0 ? stats.errorRequests / stats.totalRequests : 0;

      if (stats.failedAuth > thresholds.maxFailedAuth || errorRate > thresholds.maxErrorRate) {
        suspiciousUsers.push(userIdStr as UserId);
      }
    }

    return suspiciousUsers;
  }

  /**
   * システム全体のヘルススコアを計算する
   */
  async calculateSystemHealthScore(timeRange: TimeRange): Promise<number> {
    const [authStats, apiStats] = await Promise.all([
      this.getAuthLogStats({ timeRange } as StatsCriteria),
      this.getAPILogStats({ timeRange } as StatsCriteria),
    ]);

    // スコア計算（0-100）
    let score = 100;

    // 認証失敗率による減点（最大30点）
    score -= Math.min(30, authStats.failureRate * 100);

    // APIエラー率による減点（最大40点）
    score -= Math.min(40, apiStats.errorRate * 200);

    // レスポンスタイムによる減点（最大30点）
    // p95が1000ms以上で減点開始
    const p95Penalty = Math.max(0, (apiStats.responseTimeStats.p95 - 1000) / 100);
    score -= Math.min(30, p95Penalty);

    return Math.max(0, Math.round(score));
  }
}
