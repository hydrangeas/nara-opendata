import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUserId } from '@nara-opendata/shared-kernel';
import { LogAnalysisService } from './LogAnalysisService';
import type { IAuthLogRepository, IAPILogRepository } from '../repositories';
import type { AuthLogEntry, APILogEntry } from '../entities';
import {
  createTimeRange,
  createStatsCriteria,
  createAuthResult,
  AuthResultValue,
  AuthEventType,
} from '../value-objects';

describe('LogAnalysisService', () => {
  let service: LogAnalysisService;
  let authLogRepository: IAuthLogRepository;
  let apiLogRepository: IAPILogRepository;

  beforeEach(() => {
    authLogRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByTimeRange: vi.fn(),
      findByUserIdAndTimeRange: vi.fn(),
      findByEvent: vi.fn(),
      findByProvider: vi.fn(),
      findByResult: vi.fn(),
      countFailedByUserId: vi.fn(),
      getEventStatistics: vi.fn(),
      getProviderStatistics: vi.fn(),
    };

    apiLogRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByTimeRange: vi.fn(),
      findByUserIdAndTimeRange: vi.fn(),
      findByPath: vi.fn(),
      findByStatusCode: vi.fn(),
      findErrors: vi.fn(),
      countByUserId: vi.fn(),
      getPathStatistics: vi.fn(),
      getStatusCodeStatistics: vi.fn(),
      getResponseTimeStatistics: vi.fn(),
      findSlowResponses: vi.fn(),
    };

    service = new LogAnalysisService(authLogRepository, apiLogRepository);
  });

  describe('getAuthLogStats', () => {
    it('認証ログの統計を取得する', async () => {
      const timeRange = createTimeRange(new Date('2024-01-01'), new Date('2024-01-02'));
      const criteria = createStatsCriteria({ timeRange });

      const mockAuthLogs = [
        { result: createAuthResult(AuthResultValue.SUCCESS) },
        { result: createAuthResult(AuthResultValue.SUCCESS) },
        { result: createAuthResult(AuthResultValue.FAILURE) },
      ] as AuthLogEntry[];

      vi.mocked(authLogRepository.findByTimeRange).mockResolvedValue(mockAuthLogs);
      vi.mocked(authLogRepository.findByResult)
        .mockResolvedValueOnce([{}, {}] as AuthLogEntry[]) // SUCCESS
        .mockResolvedValueOnce([{}] as AuthLogEntry[]); // FAILURE
      vi.mocked(authLogRepository.getEventStatistics).mockResolvedValue(
        new Map([[AuthEventType.LOGIN, 3]]),
      );
      vi.mocked(authLogRepository.getProviderStatistics).mockResolvedValue(
        new Map([
          ['google', 2],
          ['github', 1],
        ]),
      );

      const stats = await service.getAuthLogStats(criteria);

      expect(stats.totalEvents).toBe(3);
      expect(stats.successfulAuth).toBe(2);
      expect(stats.failedAuth).toBe(1);
      expect(stats.failureRate).toBeCloseTo(0.333, 3);
      expect(stats.eventBreakdown.get(AuthEventType.LOGIN)).toBe(3);
      expect(stats.providerBreakdown.get('google')).toBe(2);
    });

    it('ログがない場合の統計を処理する', async () => {
      const timeRange = createTimeRange(new Date('2024-01-01'), new Date('2024-01-02'));
      const criteria = createStatsCriteria({ timeRange });

      vi.mocked(authLogRepository.findByTimeRange).mockResolvedValue([]);
      vi.mocked(authLogRepository.findByResult).mockResolvedValue([]);
      vi.mocked(authLogRepository.getEventStatistics).mockResolvedValue(new Map());
      vi.mocked(authLogRepository.getProviderStatistics).mockResolvedValue(new Map());

      const stats = await service.getAuthLogStats(criteria);

      expect(stats.totalEvents).toBe(0);
      expect(stats.failureRate).toBe(0);
    });
  });

  describe('getAPILogStats', () => {
    it('APIログの統計を取得する', async () => {
      const timeRange = createTimeRange(new Date('2024-01-01'), new Date('2024-01-02'));
      const criteria = createStatsCriteria({ timeRange });

      const userId1 = createUserId('550e8400-e29b-41d4-a716-446655440001');
      const userId2 = createUserId('550e8400-e29b-41d4-a716-446655440002');

      const mockAPILogs = [
        { userId: userId1, statusCode: { code: 200 } },
        { userId: userId1, statusCode: { code: 404 } },
        { userId: userId2, statusCode: { code: 200 } },
      ] as APILogEntry[];

      vi.mocked(apiLogRepository.findByTimeRange).mockResolvedValue(mockAPILogs);
      vi.mocked(apiLogRepository.findErrors).mockResolvedValue([
        { statusCode: { code: 404 } },
      ] as APILogEntry[]);
      vi.mocked(apiLogRepository.getPathStatistics).mockResolvedValue(new Map([['/api/data', 3]]));
      vi.mocked(apiLogRepository.getStatusCodeStatistics).mockResolvedValue(
        new Map([
          [200, 2],
          [404, 1],
        ]),
      );
      vi.mocked(apiLogRepository.getResponseTimeStatistics).mockResolvedValue({
        avg: 150,
        min: 50,
        max: 300,
        p50: 120,
        p95: 280,
        p99: 295,
      });

      const stats = await service.getAPILogStats(criteria);

      expect(stats.totalRequests).toBe(3);
      expect(stats.uniqueUsers).toBe(2);
      expect(stats.errorCount).toBe(1);
      expect(stats.errorRate).toBeCloseTo(0.333, 3);
      expect(stats.responseTimeStats.avg).toBe(150);
    });
  });

  describe('getUserActivityStats', () => {
    it('ユーザーアクティビティの統計を取得する', async () => {
      const userId = createUserId('550e8400-e29b-41d4-a716-446655440001');
      const timeRange = createTimeRange(new Date('2024-01-01'), new Date('2024-01-02'));

      const mockAuthLogs = [
        { timestamp: new Date('2024-01-01T10:00:00Z') },
        { timestamp: new Date('2024-01-01T11:00:00Z') },
      ] as AuthLogEntry[];

      const mockAPILogs = [
        {
          timestamp: new Date('2024-01-01T12:00:00Z'),
          statusCode: { code: 200 },
          responseTime: { milliseconds: 100 },
        },
        {
          timestamp: new Date('2024-01-01T13:00:00Z'),
          statusCode: { code: 404 },
          responseTime: { milliseconds: 200 },
        },
      ] as APILogEntry[];

      vi.mocked(authLogRepository.findByUserIdAndTimeRange).mockResolvedValue(mockAuthLogs);
      vi.mocked(apiLogRepository.findByUserIdAndTimeRange).mockResolvedValue(mockAPILogs);
      vi.mocked(authLogRepository.countFailedByUserId).mockResolvedValue(1);

      const stats = await service.getUserActivityStats(userId, timeRange);

      expect(stats.userId).toBe(userId);
      expect(stats.authEvents).toBe(2);
      expect(stats.apiRequests).toBe(2);
      expect(stats.failedAuthAttempts).toBe(1);
      expect(stats.errorRequests).toBe(1);
      expect(stats.avgResponseTime).toBe(150);
      expect(stats.lastActivityAt?.toISOString()).toBe('2024-01-01T13:00:00.000Z');
    });

    it('アクティビティがない場合を処理する', async () => {
      const userId = createUserId('550e8400-e29b-41d4-a716-446655440001');
      const timeRange = createTimeRange(new Date('2024-01-01'), new Date('2024-01-02'));

      vi.mocked(authLogRepository.findByUserIdAndTimeRange).mockResolvedValue([]);
      vi.mocked(apiLogRepository.findByUserIdAndTimeRange).mockResolvedValue([]);
      vi.mocked(authLogRepository.countFailedByUserId).mockResolvedValue(0);

      const stats = await service.getUserActivityStats(userId, timeRange);

      expect(stats.authEvents).toBe(0);
      expect(stats.apiRequests).toBe(0);
      expect(stats.avgResponseTime).toBe(0);
      expect(stats.lastActivityAt).toBeNull();
    });
  });

  describe('detectSuspiciousActivity', () => {
    it('疑わしいアクティビティを検出する', async () => {
      const timeRange = createTimeRange(new Date('2024-01-01'), new Date('2024-01-02'));

      const suspiciousUser = createUserId('550e8400-e29b-41d4-a716-446655440003');
      const normalUser = createUserId('550e8400-e29b-41d4-a716-446655440004');

      const mockAuthLogs = [
        { userId: suspiciousUser, result: createAuthResult(AuthResultValue.FAILURE) },
        { userId: suspiciousUser, result: createAuthResult(AuthResultValue.FAILURE) },
        { userId: suspiciousUser, result: createAuthResult(AuthResultValue.FAILURE) },
        { userId: normalUser, result: createAuthResult(AuthResultValue.SUCCESS) },
      ] as AuthLogEntry[];

      const mockAPILogs = [
        { userId: suspiciousUser, statusCode: { code: 429 } },
        { userId: suspiciousUser, statusCode: { code: 404 } },
        { userId: normalUser, statusCode: { code: 200 } },
      ] as APILogEntry[];

      vi.mocked(authLogRepository.findByTimeRange).mockResolvedValue(mockAuthLogs);
      vi.mocked(apiLogRepository.findByTimeRange).mockResolvedValue(mockAPILogs);

      const suspiciousUsers = await service.detectSuspiciousActivity(timeRange, {
        maxFailedAuth: 2,
        maxErrorRate: 0.5,
      });

      expect(suspiciousUsers).toContain(suspiciousUser);
      expect(suspiciousUsers).not.toContain(normalUser);
    });
  });

  describe('calculateSystemHealthScore', () => {
    it('システムヘルススコアを計算する', async () => {
      const timeRange = createTimeRange(new Date('2024-01-01'), new Date('2024-01-02'));

      // Mock auth stats
      vi.mocked(authLogRepository.findByTimeRange).mockResolvedValue([
        { result: createAuthResult(AuthResultValue.SUCCESS) },
        { result: createAuthResult(AuthResultValue.FAILURE) },
      ] as AuthLogEntry[]);
      vi.mocked(authLogRepository.findByResult)
        .mockResolvedValueOnce([{}] as AuthLogEntry[]) // SUCCESS
        .mockResolvedValueOnce([{}] as AuthLogEntry[]); // FAILURE
      vi.mocked(authLogRepository.getEventStatistics).mockResolvedValue(new Map());
      vi.mocked(authLogRepository.getProviderStatistics).mockResolvedValue(new Map());

      // Mock API stats
      vi.mocked(apiLogRepository.findByTimeRange).mockResolvedValue([
        { statusCode: { code: 200 } },
        { statusCode: { code: 200 } },
        { statusCode: { code: 500 } },
      ] as APILogEntry[]);
      vi.mocked(apiLogRepository.findErrors).mockResolvedValue([
        { statusCode: { code: 500 } },
      ] as APILogEntry[]);
      vi.mocked(apiLogRepository.getPathStatistics).mockResolvedValue(new Map());
      vi.mocked(apiLogRepository.getStatusCodeStatistics).mockResolvedValue(new Map());
      vi.mocked(apiLogRepository.getResponseTimeStatistics).mockResolvedValue({
        avg: 500,
        min: 100,
        max: 2000,
        p50: 400,
        p95: 1500, // 1500ms causes penalty
        p99: 1900,
      });

      const score = await service.calculateSystemHealthScore(timeRange);

      // Score calculation:
      // Base: 100
      // Auth failure rate: 50% * 100 = 50, min(30, 50) = -30 points
      // API error rate: 33.3% * 200 = 66.6, min(40, 66.6) = -40 points
      // Response time p95: (1500-1000)/100 = 5, min(30, 5) = -5 points
      // Total: 100 - 30 - 40 - 5 = 25
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeCloseTo(25, 0);
    });

    it('完璧なヘルススコアを返す', async () => {
      const timeRange = createTimeRange(new Date('2024-01-01'), new Date('2024-01-02'));

      // Mock perfect stats
      vi.mocked(authLogRepository.findByTimeRange).mockResolvedValue([
        { result: createAuthResult(AuthResultValue.SUCCESS) },
      ] as AuthLogEntry[]);
      vi.mocked(authLogRepository.findByResult)
        .mockResolvedValueOnce([{}] as AuthLogEntry[]) // SUCCESS
        .mockResolvedValueOnce([]); // FAILURE
      vi.mocked(authLogRepository.getEventStatistics).mockResolvedValue(new Map());
      vi.mocked(authLogRepository.getProviderStatistics).mockResolvedValue(new Map());

      vi.mocked(apiLogRepository.findByTimeRange).mockResolvedValue([
        { statusCode: { code: 200 } },
      ] as APILogEntry[]);
      vi.mocked(apiLogRepository.findErrors).mockResolvedValue([]);
      vi.mocked(apiLogRepository.getPathStatistics).mockResolvedValue(new Map());
      vi.mocked(apiLogRepository.getStatusCodeStatistics).mockResolvedValue(new Map());
      vi.mocked(apiLogRepository.getResponseTimeStatistics).mockResolvedValue({
        avg: 100,
        min: 50,
        max: 200,
        p50: 90,
        p95: 180,
        p99: 195,
      });

      const score = await service.calculateSystemHealthScore(timeRange);
      expect(score).toBe(100);
    });
  });
});
