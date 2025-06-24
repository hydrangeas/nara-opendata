import { describe, it, expect } from 'vitest';
import { createUserId } from '@nara-opendata/shared-kernel';
import { createEndpoint, createLogId } from '../value-objects';
import {
  createRateLimitLog,
  reconstructRateLimitLog,
  getRateLimitLogId,
  getRateLimitLogUserId,
  getRateLimitLogEndpoint,
  getRateLimitLogRequestedAt,
  isWithinTimeRange,
  isWithinSeconds,
  equalsRateLimitLog,
  rateLimitLogToString,
} from './RateLimitLog';

describe('RateLimitLog', () => {
  const userId = createUserId('550e8400-e29b-41d4-a716-446655440000');
  const endpoint = createEndpoint('/api/v1/data');

  describe('createRateLimitLog', () => {
    it('新しいレート制限ログを作成する', () => {
      const log = createRateLimitLog({ userId, endpoint });

      expect(getRateLimitLogUserId(log)).toBe(userId);
      expect(getRateLimitLogEndpoint(log)).toBe(endpoint);
      expect(getRateLimitLogRequestedAt(log)).toBeInstanceOf(Date);
      expect(getRateLimitLogId(log)).toBeDefined();
    });

    it('作成時刻が現在時刻に近い', () => {
      const before = new Date();
      const log = createRateLimitLog({ userId, endpoint });
      const after = new Date();

      const requestedAt = getRateLimitLogRequestedAt(log);
      expect(requestedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(requestedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('reconstructRateLimitLog', () => {
    it('既存のデータから再構築する', () => {
      const id = createLogId();
      const requestedAt = new Date('2024-01-01T12:00:00Z');

      const log = reconstructRateLimitLog({
        id,
        userId,
        endpoint,
        requestedAt,
      });

      expect(getRateLimitLogId(log)).toBe(id);
      expect(getRateLimitLogUserId(log)).toBe(userId);
      expect(getRateLimitLogEndpoint(log)).toBe(endpoint);
      expect(getRateLimitLogRequestedAt(log)).toBe(requestedAt);
    });
  });

  describe('isWithinTimeRange', () => {
    it('時間範囲内のログを判定する', () => {
      const log = reconstructRateLimitLog({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt: new Date('2024-01-01T12:00:00Z'),
      });

      const startTime = new Date('2024-01-01T11:00:00Z');
      const endTime = new Date('2024-01-01T13:00:00Z');

      expect(isWithinTimeRange(log, startTime, endTime)).toBe(true);
    });

    it('時間範囲外のログを判定する', () => {
      const log = reconstructRateLimitLog({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt: new Date('2024-01-01T12:00:00Z'),
      });

      const startTime = new Date('2024-01-01T13:00:00Z');
      const endTime = new Date('2024-01-01T14:00:00Z');

      expect(isWithinTimeRange(log, startTime, endTime)).toBe(false);
    });

    it('境界値を含む', () => {
      const requestedAt = new Date('2024-01-01T12:00:00Z');
      const log = reconstructRateLimitLog({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt,
      });

      expect(isWithinTimeRange(log, requestedAt, requestedAt)).toBe(true);
    });
  });

  describe('isWithinSeconds', () => {
    it('指定秒数以内のログを判定する', () => {
      const now = new Date();
      const recentLog = createRateLimitLog({ userId, endpoint });

      expect(isWithinSeconds(recentLog, 60, now)).toBe(true);
    });

    it('指定秒数を超えたログを判定する', () => {
      const now = new Date();
      const oldLog = reconstructRateLimitLog({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt: new Date(now.getTime() - 120 * 1000), // 2分前
      });

      expect(isWithinSeconds(oldLog, 60, now)).toBe(false);
    });

    it('境界値（ちょうど指定秒数）を含む', () => {
      const now = new Date();
      const log = reconstructRateLimitLog({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt: new Date(now.getTime() - 60 * 1000), // ちょうど60秒前
      });

      expect(isWithinSeconds(log, 60, now)).toBe(true);
    });

    it('現在時刻を指定しない場合は自動的に取得する', () => {
      const log = createRateLimitLog({ userId, endpoint });
      expect(isWithinSeconds(log, 60)).toBe(true);
    });
  });

  describe('equalsRateLimitLog', () => {
    it('同じIDのエンティティは等しい', () => {
      const id = createLogId();
      const log1 = reconstructRateLimitLog({
        id,
        userId,
        endpoint,
        requestedAt: new Date('2024-01-01'),
      });
      const log2 = reconstructRateLimitLog({
        id,
        userId: createUserId('123e4567-e89b-12d3-a456-426614174000'),
        endpoint: createEndpoint('/different/path'),
        requestedAt: new Date('2024-01-02'),
      });

      expect(equalsRateLimitLog(log1, log2)).toBe(true);
    });

    it('異なるIDのエンティティは等しくない', () => {
      const log1 = createRateLimitLog({ userId, endpoint });
      const log2 = createRateLimitLog({ userId, endpoint });

      expect(equalsRateLimitLog(log1, log2)).toBe(false);
    });
  });

  describe('rateLimitLogToString', () => {
    it('デバッグ用の文字列表現を返す', () => {
      const log = reconstructRateLimitLog({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt: new Date('2024-01-01T12:00:00Z'),
      });

      const str = rateLimitLogToString(log);
      expect(str).toContain('RateLimitLog');
      expect(str).toContain('550e8400-e29b-41d4-a716-446655440000');
      expect(str).toContain('/api/v1/data');
      expect(str).toContain('2024-01-01T12:00:00.000Z');
    });
  });
});
