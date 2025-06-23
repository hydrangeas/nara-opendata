import { describe, it, expect } from 'vitest';
import { createUserId } from '@nara-opendata/shared-kernel';
import { createEndpoint, createLogId } from '../value-objects';
import { RateLimitLog } from './RateLimitLog';

describe('RateLimitLog', () => {
  const userId = createUserId('550e8400-e29b-41d4-a716-446655440000');
  const endpoint = createEndpoint('/api/v1/data');

  describe('create', () => {
    it('新しいレート制限ログを作成する', () => {
      const log = RateLimitLog.create({ userId, endpoint });

      expect(log.userId).toBe(userId);
      expect(log.endpoint).toBe(endpoint);
      expect(log.requestedAt).toBeInstanceOf(Date);
      expect(log.id).toBeDefined();
    });

    it('作成時刻が現在時刻に近い', () => {
      const before = new Date();
      const log = RateLimitLog.create({ userId, endpoint });
      const after = new Date();

      expect(log.requestedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(log.requestedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('reconstruct', () => {
    it('既存のデータから再構築する', () => {
      const id = createLogId();
      const requestedAt = new Date('2024-01-01T12:00:00Z');

      const log = RateLimitLog.reconstruct({
        id,
        userId,
        endpoint,
        requestedAt,
      });

      expect(log.id).toBe(id);
      expect(log.userId).toBe(userId);
      expect(log.endpoint).toBe(endpoint);
      expect(log.requestedAt).toBe(requestedAt);
    });
  });

  describe('isWithinTimeRange', () => {
    it('時間範囲内のログを判定する', () => {
      const log = RateLimitLog.reconstruct({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt: new Date('2024-01-01T12:00:00Z'),
      });

      const startTime = new Date('2024-01-01T11:00:00Z');
      const endTime = new Date('2024-01-01T13:00:00Z');

      expect(log.isWithinTimeRange(startTime, endTime)).toBe(true);
    });

    it('時間範囲外のログを判定する', () => {
      const log = RateLimitLog.reconstruct({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt: new Date('2024-01-01T12:00:00Z'),
      });

      const startTime = new Date('2024-01-01T13:00:00Z');
      const endTime = new Date('2024-01-01T14:00:00Z');

      expect(log.isWithinTimeRange(startTime, endTime)).toBe(false);
    });

    it('境界値を含む', () => {
      const requestedAt = new Date('2024-01-01T12:00:00Z');
      const log = RateLimitLog.reconstruct({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt,
      });

      expect(log.isWithinTimeRange(requestedAt, requestedAt)).toBe(true);
    });
  });

  describe('isWithinSeconds', () => {
    it('指定秒数以内のログを判定する', () => {
      const now = new Date();
      const recentLog = RateLimitLog.create({ userId, endpoint });

      expect(recentLog.isWithinSeconds(60, now)).toBe(true);
    });

    it('指定秒数を超えたログを判定する', () => {
      const now = new Date();
      const oldLog = RateLimitLog.reconstruct({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt: new Date(now.getTime() - 120 * 1000), // 2分前
      });

      expect(oldLog.isWithinSeconds(60, now)).toBe(false);
    });

    it('境界値（ちょうど指定秒数）を含む', () => {
      const now = new Date();
      const log = RateLimitLog.reconstruct({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt: new Date(now.getTime() - 60 * 1000), // ちょうど60秒前
      });

      expect(log.isWithinSeconds(60, now)).toBe(true);
    });

    it('現在時刻を指定しない場合は自動的に取得する', () => {
      const log = RateLimitLog.create({ userId, endpoint });
      expect(log.isWithinSeconds(60)).toBe(true);
    });
  });

  describe('equals', () => {
    it('同じIDのエンティティは等しい', () => {
      const id = createLogId();
      const log1 = RateLimitLog.reconstruct({
        id,
        userId,
        endpoint,
        requestedAt: new Date('2024-01-01'),
      });
      const log2 = RateLimitLog.reconstruct({
        id,
        userId: createUserId('123e4567-e89b-12d3-a456-426614174000'),
        endpoint: createEndpoint('/different/path'),
        requestedAt: new Date('2024-01-02'),
      });

      expect(log1.equals(log2)).toBe(true);
    });

    it('異なるIDのエンティティは等しくない', () => {
      const log1 = RateLimitLog.create({ userId, endpoint });
      const log2 = RateLimitLog.create({ userId, endpoint });

      expect(log1.equals(log2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('デバッグ用の文字列表現を返す', () => {
      const log = RateLimitLog.reconstruct({
        id: createLogId(),
        userId,
        endpoint,
        requestedAt: new Date('2024-01-01T12:00:00Z'),
      });

      const str = log.toString();
      expect(str).toContain('RateLimitLog');
      expect(str).toContain('550e8400-e29b-41d4-a716-446655440000');
      expect(str).toContain('/api/v1/data');
      expect(str).toContain('2024-01-01T12:00:00.000Z');
    });
  });

  describe('toJSON', () => {
    it('JSONシリアライズ可能なオブジェクトを返す', () => {
      const id = createLogId();
      const requestedAt = new Date('2024-01-01T12:00:00Z');
      const log = RateLimitLog.reconstruct({
        id,
        userId,
        endpoint,
        requestedAt,
      });

      const json = log.toJSON();
      expect(json).toEqual({
        id,
        userId,
        endpoint,
        requestedAt,
      });
    });
  });
});
